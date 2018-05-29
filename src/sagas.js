import Api from 'ovirtapi'
import { persistStateToLocalStorage } from './storage'
import Selectors from './selectors'
import AppConfiguration from './config'
import SagasWorkers from './saga/builder'
import vmDisksSagas from './components/VmDisks/sagas'
import newVmDialogSagas from './components/NewDiskDialog/sagas'
import { flatMap } from './utils'

import {
  put,
  takeEvery,
  takeLatest,
  throttle,
  all,
  call,
} from 'redux-saga/effects'

import { logDebug } from './helpers'

import {
  setChanged,
  updateIcons,
  setVmDisks,
  updateVms,
  removeVms,
  vmActionInProgress,
  setVmConsoles,
  removeMissingVms,
  removeMissingClusters,
  removeMissingHosts,
  removeMissingTemplates,
  removeMissingOSs,
  setVmSessions,
  persistState,

  getSingleVm,
  addClusters,
  addHosts,
  addTemplates,
  addAllOS,
  setStorageDomains,
  setDataCenters,
  addNetworksToVnicProfiles,
  setVnicProfiles,

  getSinglePool,
  removeMissingPools,
  removePools,
  updatePools,
  updateVmsPoolsCount,
  poolActionInProgress,

  redirectRoute,
  refresh,
  getVmsByCount,
  getPoolsByCount,
  setStorages,
  removeMissingStorages,
  setFiles,
  setVmCDRom,
  setVmNics,
  setUSBFilter,
  removeActiveRequest,
} from './actions/index'

import {
  callExternalAction,
  delay,
  foreach,
} from './saga/utils'

import {
  doCheckTokenExpired,
  login,
  logout,
  compareVersion,
} from './saga/login'

import {
  downloadVmConsole,
  getConsoleOptions,
  saveConsoleOptions,
  getRDPVm,
  fetchConsoleVmMeta,
} from './saga/consoles'

import {
  ADD_VM_NIC,
  CHECK_TOKEN_EXPIRED,
  DELAYED_REMOVE_ACTIVE_REQUEST,
  DELETE_VM_NIC,
  GET_ALL_CLUSTERS,
  GET_ALL_FILES_FOR_ISO,
  GET_ALL_HOSTS,
  GET_ALL_OS,
  GET_ALL_TEMPLATES,
  GET_ALL_STORAGE_DOMAINS,
  GET_ALL_VNIC_PROFILES,
  GET_BY_PAGE,
  GET_CONSOLE_OPTIONS,
  GET_ISO_STORAGES,
  GET_POOLS_BY_COUNT,
  GET_POOLS_BY_PAGE,
  GET_RDP_VM,
  GET_USB_FILTER,
  GET_VMS_BY_COUNT,
  GET_VMS_BY_PAGE,
  DOWNLOAD_CONSOLE_VM,
  LOGIN,
  LOGOUT,
  PERSIST_STATE,
  REFRESH_DATA,
  REMOVE_VM,
  RESTART_VM,
  SAVE_CONSOLE_OPTIONS,
  SELECT_POOL_DETAIL,
  SELECT_VM_DETAIL,
  SCHEDULER__1_MIN,
  SHUTDOWN_VM,
  START_POOL,
  START_VM,
  SUSPEND_VM,
} from './constants/index'

function* fetchByPage (action) {
  yield put(setChanged({ value: false }))
  yield fetchVmsByPage(action)
  yield fetchPoolsByPage(action)
}

function* persistStateSaga () {
  yield persistStateToLocalStorage({ icons: Selectors.getAllIcons().toJS() })
}

function* fetchUnknownIconsForVms ({ vms, os }) {
  // unique iconIds from all vms or os (if available)
  const iconsIds = new Set()
  if (vms) {
    vms.map(vm => vm.icons.large.id).forEach(id => iconsIds.add(id))
  }

  if (os) {
    os.map(os => os.icons.large.id).forEach(id => iconsIds.add(id))
  }

  // reduce to just unknown
  const allKnownIcons = Selectors.getAllIcons()
  const notLoadedIconIds = [...iconsIds].filter(id => !allKnownIcons.get(id))

  yield * foreach(notLoadedIconIds, function* (iconId) {
    yield fetchIcon({ iconId })
  })
}

function* fetchIcon ({ iconId }) {
  if (iconId) {
    const icon = yield callExternalAction('icon', Api.icon, { type: 'GET_ICON', payload: { id: iconId } })
    if (icon['media_type'] && icon['data']) {
      yield put(updateIcons({ icons: [Api.iconToInternal({ icon })] }))
    }
  }
}

function* refreshData (action) {
  console.log('refreshData(): ', action.payload)
  if (!action.payload.quiet) {
    logDebug('refreshData(): not quiet')
  }

  // do refresh sequentially
  yield fetchVmsByCount(getVmsByCount({ count: action.payload.page * AppConfiguration.pageLimit, shallowFetch: !!action.payload.shallowFetch }))
  yield fetchPoolsByCount(getPoolsByCount({ count: action.payload.page * AppConfiguration.pageLimit }))

  logDebug('refreshData() finished')
}

function* fetchVmsByPage (action) {
  const actual = Selectors.getOvirtVersion().toJS()
  if (compareVersion({ major: parseInt(actual.major), minor: parseInt(actual.minor) }, { major: 4, minor: 2 })) {
    yield fetchVmsByPageV42(action)
  } else {
    yield fetchVmsByPageVLower(action)
  }
}

function* fetchVmsByPageV42 (action) {
  const { shallowFetch, page } = action.payload
  let additional = []
  if (!shallowFetch) {
    additional = ['cdroms', 'sessions', 'disk_attachments.disk', 'graphics_consoles', 'nics']
  }
  action.payload.additional = additional
  // TODO: paging: split this call to a loop per up to 25 vms
  const allVms = yield callExternalAction('getVmsByPage', Api.getVmsByPage, action)

  if (allVms && allVms['vm']) { // array
    const internalVms = allVms.vm.map(vm => Api.vmToInternal({ vm, getSubResources: true }))

    yield put(updateVms({ vms: internalVms, copySubResources: true, page: page }))
    yield fetchUnknownIconsForVms({ vms: internalVms })
  }

  yield put(persistState())
}

function* fetchVmsByPageVLower (action) {
  const { shallowFetch, page } = action.payload

  // TODO: paging: split this call to a loop per up to 25 vms
  const allVms = yield callExternalAction('getVmsByPage', Api.getVmsByPage, action)

  if (allVms && allVms['vm']) { // array
    const internalVms = allVms.vm.map(vm => Api.vmToInternal({ vm }))

    yield put(updateVms({ vms: internalVms, copySubResources: true, page: page }))
    yield fetchUnknownIconsForVms({ vms: internalVms })

    if (!shallowFetch) {
      yield fetchConsoleMetadatas({ vms: internalVms })
      yield fetchDisks({ vms: internalVms })
      yield fetchVmsSessions({ vms: internalVms })
      yield fetchVmsCDRom({ vms: internalVms })
      yield fetchVmsNics({ vms: internalVms })
    } else {
      logDebug('getVmsByPage() shallow fetch requested - skipping other resources')
    }
  }

  yield put(persistState())
}

function* fetchVmsByCount (action) {
  const actual = Selectors.getOvirtVersion().toJS()
  if (compareVersion({ major: parseInt(actual.major), minor: parseInt(actual.minor) }, { major: 4, minor: 2 })) {
    yield fetchVmsByCountV42(action)
  } else {
    yield fetchVmsByCountVLower(action)
  }
}

function* fetchVmsByCountV42 (action) {
  const { shallowFetch, page } = action.payload
  let additional = []
  if (!shallowFetch) {
    additional = ['cdroms', 'sessions', 'disk_attachments.disk', 'graphics_consoles', 'nics']
  }
  action.payload.additional = additional
  const allVms = yield callExternalAction('getVmsByCount', Api.getVmsByCount, action)

  if (allVms && allVms['vm']) { // array
    const internalVms = allVms.vm.map(vm => Api.vmToInternal({ vm, getSubResources: true }))

    const vmIdsToPreserve = internalVms.map(vm => vm.id)
    yield put(removeMissingVms({ vmIdsToPreserve }))

    yield put(updateVms({ vms: internalVms, copySubResources: true, page: page }))
    yield fetchUnknownIconsForVms({ vms: internalVms })
  }

  yield put(persistState())
}

function* fetchVmsByCountVLower (action) {
  const { shallowFetch } = action.payload

  // TODO: paging: split this call to a loop per up to 25 vms
  const allVms = yield callExternalAction('getVmsByCount', Api.getVmsByCount, action)

  if (allVms && allVms['vm']) { // array
    const internalVms = allVms.vm.map(vm => Api.vmToInternal({ vm }))

    const vmIdsToPreserve = internalVms.map(vm => vm.id)
    yield put(removeMissingVms({ vmIdsToPreserve }))

    yield put(updateVms({ vms: internalVms, copySubResources: true }))
    yield fetchUnknownIconsForVms({ vms: internalVms })

    if (!shallowFetch) {
      yield fetchConsoleMetadatas({ vms: internalVms })
      yield fetchDisks({ vms: internalVms })
      yield fetchVmsSessions({ vms: internalVms })
      yield fetchVmsCDRom({ vms: internalVms })
      yield fetchVmsNics({ vms: internalVms })
    } else {
      logDebug('fetchVmsByCount() shallow fetch requested - skipping other resources')
    }
  }

  yield put(persistState())
}

function* fetchPoolsByCount (action) {
  const allPools = yield callExternalAction('getPoolsByCount', Api.getPoolsByCount, action)

  if (allPools && allPools['vm_pool']) { // array
    const internalPools = allPools.vm_pool.map(pool => Api.poolToInternal({ pool }))

    const poolIdsToPreserve = internalPools.map(pool => pool.id)
    yield put(removeMissingPools({ poolIdsToPreserve }))

    yield put(updatePools({ pools: internalPools }))
    yield put(updateVmsPoolsCount())
  }

  yield put(persistState())
}

function* fetchPoolsByPage (action) {
  const allPools = yield callExternalAction('getPoolsByPage', Api.getPoolsByPage, action)

  if (allPools && allPools['vm_pool']) { // array
    const internalPools = allPools.vm_pool.map(pool => Api.poolToInternal({ pool }))

    yield put(updatePools({ pools: internalPools }))
    yield put(updateVmsPoolsCount())
  }

  yield put(persistState())
}

function* fetchSinglePool (action) {
  const pool = yield callExternalAction('getPool', Api.getPool, action, true)

  if (pool && pool.id) {
    const internalPool = Api.poolToInternal({ pool })

    yield put(updatePools({ pools: [internalPool] }))
  } else {
    if (pool && pool.error && pool.error.status === 404) {
      yield put(removePools({ poolIds: [action.payload.poolId] }))
    }
  }
  yield put(updateVmsPoolsCount())
}

function* fetchVmsSessions ({ vms }) {
  yield * foreach(vms, function* (vm) {
    const sessionsInternal = yield fetchVmSessions({ vmId: vm.id })
    yield put(setVmSessions({ vmId: vm.id, sessions: sessionsInternal }))
  })
}

export function* fetchSingleVm (action) {
  yield startProgress({ vmId: action.payload.vmId, name: 'refresh_single' })

  const vm = yield callExternalAction('getVm', Api.getVm, action, true)

  if (vm && vm.id) {
    const internalVm = Api.vmToInternal({ vm })

    internalVm.disks = yield fetchVmDisks({ vmId: internalVm.id })
    internalVm.consoles = yield fetchConsoleVmMeta({ vmId: internalVm.id })
    internalVm.sessions = yield fetchVmSessions({ vmId: internalVm.id })
    internalVm.cdrom = yield fetchVmCDRom({ vmId: internalVm.id, running: internalVm.status === 'up' })
    internalVm.nics = yield fetchVmNics({ vmId: internalVm.id })

    yield put(updateVms({ vms: [internalVm] }))
    yield fetchUnknownIconsForVms({ vms: [internalVm] })
  } else {
    if (vm && vm.error && vm.error.status === 404) {
      yield put(removeVms({ vmIds: [action.payload.vmId] }))
    }
  }
  yield stopProgress({ vmId: action.payload.vmId, name: 'refresh_single' })

  yield put(updateVmsPoolsCount())
}

export function* fetchDisks ({ vms }) {
  yield * foreach(vms, function* (vm) {
    const vmId = vm.id
    const disks = yield fetchVmDisks({ vmId })
    yield put(setVmDisks({ vmId, disks }))
  })
}

function* fetchVmCDRom ({ vmId, running }) {
  const cdrom = yield callExternalAction('getCDRom', Api.getCDRom, { type: 'GET_VM_CDROM', payload: { vmId, running } })
  if (cdrom) {
    const cdromInternal = Api.CDRomToInternal({ cdrom })
    return cdromInternal
  }
  return null
}

function* fetchVmsCDRom ({ vms }) {
  yield * foreach(vms, function* (vm) {
    const cdromInternal = yield fetchVmCDRom({ vmId: vm.id, running: vm.status === 'up' })
    yield put(setVmCDRom({ vmId: vm.id, cdrom: cdromInternal }))
  })
}

function* fetchConsoleMetadatas ({ vms }) {
  yield * foreach(vms, function* (vm) {
    const consolesInternal = yield fetchConsoleVmMeta({ vmId: vm.id })
    yield put(setVmConsoles({ vmId: vm.id, consoles: consolesInternal }))
  })
}

function* fetchVmDisks ({ vmId }) {
  const diskattachments = yield callExternalAction('diskattachments', Api.diskattachments, { type: 'GET_DISK_ATTACHMENTS', payload: { vmId } })

  if (diskattachments && diskattachments['disk_attachment']) { // array
    const internalDisks = []
    yield * foreach(diskattachments['disk_attachment'], function* (attachment) {
      const diskId = attachment.disk.id
      const disk = yield callExternalAction('disk', Api.disk, { type: 'GET_DISK_DETAILS', payload: { diskId } })
      internalDisks.push(Api.diskToInternal({ disk, attachment }))
    })
    return internalDisks
  }
  return []
}

function* addVmNic (action) {
  const nic = yield callExternalAction('addNicToVm', Api.addNicToVm, action)

  if (nic && nic.id) {
    const nicsInternal = yield fetchVmNics({ vmId: action.payload.vmId })
    yield put(setVmNics({ vmId: action.payload.vmId, nics: nicsInternal }))
  }
}

function* deleteVmNic (action) {
  yield callExternalAction('deleteNicFromVm', Api.deleteNicFromVm, action)

  const nicsInternal = yield fetchVmNics({ vmId: action.payload.vmId })
  yield put(setVmNics({ vmId: action.payload.vmId, nics: nicsInternal }))
}

function* startProgress ({ vmId, poolId, name }) {
  if (vmId) {
    yield put(vmActionInProgress({ vmId, name, started: true }))
  } else {
    yield put(poolActionInProgress({ poolId, name, started: true }))
  }
}

function* stopProgress ({ vmId, poolId, name, result }) {
  const fetchSingle = vmId ? fetchSingleVm : fetchSinglePool
  const getSingle = vmId ? getSingleVm : getSinglePool
  const actionInProgress = vmId ? vmActionInProgress : poolActionInProgress

  const params = vmId ? { vmId } : { poolId }
  if (result && result.status === 'complete') {
    // do not call 'end of in progress' if successful,
    // since UI will be updated by refresh
    yield delay(5 * 1000)
    yield fetchSingle(getSingle(params))
    yield delay(30 * 1000)
    yield fetchSingle(getSingle(params))
  }

  yield put(actionInProgress(Object.assign(params, { name, started: false })))
}

function* shutdownVm (action) {
  yield startProgress({ vmId: action.payload.vmId, name: 'shutdown' })
  const result = yield callExternalAction('shutdown', Api.shutdown, action)
  yield stopProgress({ vmId: action.payload.vmId, name: 'shutdown', result })
}

function* restartVm (action) {
  yield startProgress({ vmId: action.payload.vmId, name: 'restart' })
  const result = yield callExternalAction('restart', Api.restart, action)
  yield stopProgress({ vmId: action.payload.vmId, name: 'restart', result })
}

function* suspendVm (action) {
  yield startProgress({ vmId: action.payload.vmId, name: 'suspend' })
  const result = yield callExternalAction('suspend', Api.suspend, action)
  yield stopProgress({ vmId: action.payload.vmId, name: 'suspend', result })
}

function* startVm (action) {
  yield startProgress({ vmId: action.payload.vmId, name: 'start' })
  const result = yield callExternalAction('start', Api.start, action)
  // TODO: check status at refresh --> conditional refresh wait_for_launch
  yield stopProgress({ vmId: action.payload.vmId, name: 'start', result })
}

function* startPool (action) {
  yield startProgress({ poolId: action.payload.poolId, name: 'start' })
  const result = yield callExternalAction('startPool', Api.startPool, action)
  yield stopProgress({ poolId: action.payload.poolId, name: 'start', result })
}

function* removeVm (action) {
  yield startProgress({ vmId: action.payload.vmId, name: 'remove' })
  const result = yield callExternalAction('remove', Api.remove, action)
  if (result.status === 'complete') {
    yield put(redirectRoute({ route: '/' }))
  }
  yield stopProgress({ vmId: action.payload.vmId, name: 'remove', result })
}

function* fetchVmSessions ({ vmId }) {
  const sessions = yield callExternalAction('sessions', Api.sessions, { payload: { vmId } })

  if (sessions && sessions['session']) {
    return Api.sessionsToInternal({ sessions })
  }
  return []
}

/**
 * VmDetail is to be rendered.
 */
export function* selectVmDetail (action) {
  yield fetchSingleVm(getSingleVm({ vmId: action.payload.vmId })) // async data refresh
}

function* selectPoolDetail (action) {
  yield fetchSinglePool(getSinglePool({ poolId: action.payload.poolId }))
}

function* fetchAllTemplates (action) {
  const templates = yield callExternalAction('getAllTemplates', Api.getAllTemplates, action)

  if (templates && templates['template']) {
    const templatesInternal = templates.template.map(template => Api.templateToInternal({ template }))
    yield put(addTemplates({ templates: templatesInternal }))

    const templateIdsToPreserve = templatesInternal.map(item => item.id)
    yield put(removeMissingTemplates({ templateIdsToPreserve }))
  }
}

/**
 * Storage domain not attached to any data center won't be fetched.
 */
function* fetchAllAttachedStorageDomains (action) {
  Object.assign(action, { payload: { additional: [ 'storage_domains' ] } })
  const dataCentersApi = yield callExternalAction('getAllDataCenters', Api.getAllDataCenters, action)
  if (!dataCentersApi || !dataCentersApi.data_center) {
    return
  }

  // getting data centers is necessary to get storage domains with statuses
  // so why not to store them when we have them fresh
  const dataCentersInternal = dataCentersApi.data_center.map(Api.dataCenterToInternal)
  yield put(setDataCenters(dataCentersInternal))

  const storageDomainsApi = flatMap(
    dataCentersApi.data_center,
    dataCenterApi => (dataCenterApi.storage_domains && dataCenterApi.storage_domains.storage_domain) || [])
  const storageDomainsInternal = storageDomainsApi.map(Api.storageDomainToInternal)
  const storageDomainsMerged = mergeStorageDomains(storageDomainsInternal)
  yield put(setStorageDomains(storageDomainsMerged))
}

/**
 * @param {Array<StorageDomainInternal>} storageDomainsInternal list of all storage domains.
 *                                       It may contain single storage multiple times with status for different data
 *                                       center.
 * @return {Array<StorageDomainInternal>} List of storage domains with merged statuses. Each storage domain from input
 *                                        is listed exactly once.
 */
function mergeStorageDomains (storageDomainsInternal) {
  const idToStorageDomain = storageDomainsInternal.reduce((accum, storageDomain) => {
    const existingStorageDomain = accum[storageDomain.id]
    if (!existingStorageDomain) {
      accum[storageDomain.id] = storageDomain
      return accum
    }
    Object.assign(existingStorageDomain.statusPerDataCenter, storageDomain.statusPerDataCenter)
    return accum
  }, {})
  const mergedStorageDomains = Object.values(idToStorageDomain)
  return mergedStorageDomains
}

function* fetchAllClusters (action) {
  const clusters = yield callExternalAction('getAllClusters', Api.getAllClusters, action)

  if (clusters && clusters['cluster']) {
    const clustersInternal = clusters.cluster.map(cluster => Api.clusterToInternal({ cluster }))
    yield put(addClusters({ clusters: clustersInternal }))

    const clusterIdsToPreserve = clustersInternal.map(item => item.id)
    yield put(removeMissingClusters({ clusterIdsToPreserve }))
  }
}

function* fetchAllHosts (action) {
  const hosts = yield callExternalAction('getAllHosts', Api.getAllHosts, action)

  if (hosts && hosts['host']) {
    const hostsInternal = hosts.host.map(host => Api.hostToInternal({ host }))
    yield put(addHosts({ hosts: hostsInternal }))

    const hostIdsToPreserve = hostsInternal.map(item => item.id)
    yield put(removeMissingHosts({ hostIdsToPreserve }))
  }
}

function* fetchAllOS (action) {
  const operatingSystems = yield callExternalAction('getAllOperatingSystems', Api.getAllOperatingSystems, action)

  if (operatingSystems && operatingSystems['operating_system']) {
    const operatingSystemsInternal = operatingSystems.operating_system.map(os => Api.OSToInternal({ os }))
    yield put(addAllOS({ os: operatingSystemsInternal }))

    const osIdsToPreserve = operatingSystemsInternal.map(item => item.id)
    // load icons for OS
    yield fetchUnknownIconsForVms({ os: operatingSystemsInternal })
    yield put(removeMissingOSs({ osIdsToPreserve }))
  }
}

function* fetchVmsNics ({ vms }) {
  yield all(vms.map((vm) => call(function* () {
    const nicsInternal = yield fetchVmNics({ vmId: vm.id })
    yield put(setVmNics({ vmId: vm.id, nics: nicsInternal }))
  })))
}

function* fetchVmNics ({ vmId }) {
  const nics = yield callExternalAction('getVmsNic', Api.getVmsNic, { type: 'GET_VM_NICS', payload: { vmId } })

  if (nics && nics['nic']) {
    const nicsInternal = nics.nic.map(nic => Api.nicToInternal({ nic }))
    return nicsInternal
  }
  return []
}

function* fetchISOStorages (action) {
  const storages = yield callExternalAction('getStorages', Api.getStorages, action)
  if (storages && storages['storage_domain']) {
    const storagesInternal = storages.storage_domain.map(storage => Api.storageToInternal({ storage })).filter(v => v.type === 'iso')
    yield put(setStorages({ storages: storagesInternal }))
    for (let i in storagesInternal) {
      yield fetchAllFilesForISO({ payload: { storageId: storagesInternal[i].id } })
    }
    const storageIdsToPreserve = storagesInternal.map(item => item.id)
    yield put(removeMissingStorages({ storageIdsToPreserve }))
  }
}

function* fetchAllFilesForISO (action) {
  const files = yield callExternalAction('getStorageFiles', Api.getStorageFiles, action)

  if (files && files['file']) {
    const filesInternal = files.file.map(file => Api.fileToInternal({ file }))
    yield put(setFiles({ storageId: action.payload.storageId, files: filesInternal }))
  }
}

function* fetchUSBFilter (action) {
  const usbFilter = yield callExternalAction('getUSBFilter', Api.getUSBFilter, action)
  if (usbFilter) {
    yield put(setUSBFilter({ usbFilter }))
  }
}

function* fetchAllVnicProfiles (action) {
  const vnicProfiles = yield callExternalAction('getAllVnicProfiles', Api.getAllVnicProfiles, action)
  if (vnicProfiles && vnicProfiles['vnic_profile']) {
    const vnicProfilesInternal = vnicProfiles.vnic_profile.map(vnicProfile => Api.vnicProfileToInternal({ vnicProfile }))
    yield put(setVnicProfiles({ vnicProfiles: vnicProfilesInternal }))
    const actual = Selectors.getOvirtVersion().toJS()
    if (!compareVersion({ major: parseInt(actual.major), minor: parseInt(actual.minor) }, { major: 4, minor: 2 })) {
      yield fetchAllNetworks()
    }
  }
}

function* fetchAllNetworks () {
  const networks = yield callExternalAction('getAllNetworks', Api.getAllNetworks, { type: 'GET_ALL_NETWORKS' })
  if (networks && networks['network']) {
    const networksInternal = networks.network.map(network => Api.networkToInternal({ network }))
    yield put(addNetworksToVnicProfiles({ networks: networksInternal }))
  }
}

function* schedulerPerMinute (action) {
  logDebug('Starting schedulerPerMinute() scheduler')

  // TODO: do we need to stop the loop? Consider takeLatest in the rootSaga 'restarts' the loop if needed
  while (true) {
    yield delay(60 * 1000) // 1 minute
    logDebug('schedulerPerMinute() event')

    const oVirtVersion = Selectors.getOvirtVersion()
    if (oVirtVersion.get('passed')) {
      // Actions to be executed no more than once per minute:
      yield refreshData(refresh({
        quiet: true,
        shallowFetch: true,
        page: Selectors.getCurrentPage(),
      }))
    } else {
      logDebug('schedulerPerMinute() event skipped since oVirt API version does not match')
    }
  }
}

function* delayedRemoveActiveRequest ({ payload: requestId }) {
  yield delay(500)
  yield put(removeActiveRequest(requestId))
}

// Sagas workers for using in different sagas modules
let sagasFunctions = {
  foreach,
  callExternalAction,
  fetchVmSessions,
  fetchSingleVm,
}

export function* rootSaga () {
  yield all([
    takeEvery(LOGIN, login),
    takeEvery(LOGOUT, logout),
    takeLatest(CHECK_TOKEN_EXPIRED, doCheckTokenExpired),

    takeEvery(SCHEDULER__1_MIN, schedulerPerMinute),
    throttle(1000, REFRESH_DATA, refreshData),

    throttle(100, GET_BY_PAGE, fetchByPage),
    throttle(100, GET_VMS_BY_PAGE, fetchVmsByPage),
    throttle(100, GET_VMS_BY_COUNT, fetchVmsByCount),
    throttle(100, GET_POOLS_BY_COUNT, fetchPoolsByCount),
    throttle(100, GET_POOLS_BY_PAGE, fetchPoolsByPage),
    takeLatest(PERSIST_STATE, persistStateSaga),

    takeEvery(SHUTDOWN_VM, shutdownVm),
    takeEvery(RESTART_VM, restartVm),
    takeEvery(START_VM, startVm),
    takeEvery(DOWNLOAD_CONSOLE_VM, downloadVmConsole),
    takeEvery(GET_RDP_VM, getRDPVm),
    takeEvery(SUSPEND_VM, suspendVm),
    takeEvery(START_POOL, startPool),
    takeEvery(REMOVE_VM, removeVm),

    takeLatest(GET_ALL_CLUSTERS, fetchAllClusters),
    takeLatest(GET_ALL_TEMPLATES, fetchAllTemplates),
    takeLatest(GET_ALL_STORAGE_DOMAINS, fetchAllAttachedStorageDomains),
    takeLatest(GET_ALL_OS, fetchAllOS),
    takeLatest(GET_ALL_HOSTS, fetchAllHosts),
    takeLatest(GET_ALL_VNIC_PROFILES, fetchAllVnicProfiles),
    throttle(100, GET_ISO_STORAGES, fetchISOStorages),
    throttle(100, GET_ALL_FILES_FOR_ISO, fetchAllFilesForISO),

    takeEvery(SELECT_VM_DETAIL, selectVmDetail),
    takeEvery(ADD_VM_NIC, addVmNic),
    takeEvery(DELETE_VM_NIC, deleteVmNic),
    takeEvery(GET_CONSOLE_OPTIONS, getConsoleOptions),
    takeEvery(SAVE_CONSOLE_OPTIONS, saveConsoleOptions),

    takeEvery(SELECT_POOL_DETAIL, selectPoolDetail),
    takeEvery(GET_USB_FILTER, fetchUSBFilter),
    takeEvery(DELAYED_REMOVE_ACTIVE_REQUEST, delayedRemoveActiveRequest),

    ...vmDisksSagas,
    ...newVmDialogSagas,

    ...SagasWorkers(sagasFunctions),
  ])
}
