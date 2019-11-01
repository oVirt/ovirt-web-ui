import Api from '_/ovirtapi'
import AppConfiguration from '_/config'
import { saveToLocalStorage } from '_/storage'

import vmSnapshotsSagas from '_/components/VmDetails/cards/SnapshotsCard/sagas'
import optionsDialogSagas from '_/components/OptionsDialog/sagas'
import vmDisksSagas from './disks'
import storageDomainSagas, { fetchIsoFiles } from './storageDomains'
import loginSagas from './login'
import { fetchUnknownIcons } from './osIcons'

import {
  all,
  call,
  put,
  race,
  take,
  takeEvery,
  takeLatest,
  throttle,
  select,
} from 'redux-saga/effects'

import { push } from 'connected-react-router'
import {
  setChanged,
  setVmDisks,
  updateVms,
  removeVms,
  vmActionInProgress,
  setVmConsoles,
  removeMissingVms,
  setVmSessions,
  setVmActionResult,

  getSingleVm,
  selectVmDetail as actionSelectVmDetail,
  setClusters,
  setHosts,
  setTemplates,
  setOperatingSystems,
  setUserGroups,
  addNetworksToVnicProfiles,
  setVnicProfiles,
  setVmSnapshots,

  setUserMessages,
  dismissUserMessage,

  getSinglePool,
  removeMissingPools,
  removePools,
  updatePools,
  updateVmsPoolsCount,
  poolActionInProgress,

  refresh,
  getVmsByCount,
  getPoolsByCount,
  getIsoFiles,
  getConsoleOptions as actionGetConsoleOptions,
  setVmCdRom,
  setVmNics,
  removeActiveRequest,
  stopSchedulerFixedDelay,
  getVmCdRom,
  changeVmCdRom as actionChangeVmCdRom,
  restartVm as actionRestartVm,
  setCurrentPage,
  setVmsFilters,
} from '_/actions'

import {
  callExternalAction,
  compareVersion,
  delay,
  doCheckTokenExpired,
  foreach,
  fetchPermits,
  PermissionsType,
} from './utils'

import {
  downloadVmConsole,
  getConsoleOptions,
  saveConsoleOptions,
  getRDPVm,
  fetchConsoleVmMeta,
  openConsoleModal,
} from './console'

import {
  ADD_VM_NIC,
  CHANGE_PAGE,
  CHANGE_VM_CDROM,
  OPEN_CONSOLE_MODAL,
  CHECK_TOKEN_EXPIRED,
  CLEAR_USER_MSGS,
  CREATE_VM,
  DELAYED_REMOVE_ACTIVE_REQUEST,
  DELETE_VM_NIC,
  DISMISS_EVENT,
  DOWNLOAD_CONSOLE_VM,
  EDIT_VM,
  EDIT_VM_NIC,
  GET_ALL_CLUSTERS,
  GET_ALL_EVENTS,
  GET_ALL_HOSTS,
  GET_ALL_OS,
  GET_ALL_TEMPLATES,
  GET_ALL_VNIC_PROFILES,
  GET_BY_PAGE,
  GET_CONSOLE_OPTIONS,
  GET_POOLS_BY_COUNT,
  GET_POOLS_BY_PAGE,
  GET_RDP_VM,
  GET_USER_GROUPS,
  GET_VMS_BY_COUNT,
  GET_VMS_BY_PAGE,
  REFRESH_DATA,
  REMOVE_VM,
  RESTART_VM,
  SAVE_CONSOLE_OPTIONS,
  SAVE_FILTERS,
  SELECT_POOL_DETAIL,
  SELECT_VM_DETAIL,
  SHUTDOWN_VM,
  START_POOL,
  START_SCHEDULER_FIXED_DELAY,
  START_VM,
  STOP_SCHEDULER_FIXED_DELAY,
  SUSPEND_VM,

  CONSOLE_PAGE_TYPE,
  DETAIL_PAGE_TYPE,
  DIALOG_PAGE_TYPE,
  MAIN_PAGE_TYPE,
  NO_REFRESH_TYPE,
} from '_/constants'

import {
  arrayMatch,
  canUserEditDisk,
  canUserEditVm,
  canUserEditVmStorage,
  canUserUseCluster,
  canUserUseVnicProfile,
  getUserPermits,
  canUserUseTemplate,
} from '_/utils'

const vmFetchAdditionalList =
  [
    'cdroms',
    'sessions',
    'disk_attachments.disk',
    'graphics_consoles',
    'nics',
    'snapshots',
    'statistics',
    'permissions.role.permits',
  ]

const EVERYONE_GROUP_ID = 'eee00000-0000-0000-0000-123456789eee'

/**
 * Compare the current oVirt version (held in redux) to the given version.
 */
function* compareVersionToCurrent ({ major, minor }) {
  const current = yield select(state => state.config.get('oVirtApiVersion').toJS())
  return compareVersion(current, { major, minor })
}

function* fetchByPage (action) {
  yield put(setChanged({ value: false }))
  yield fetchVmsByPage(action)
  yield fetchPoolsByPage(action)
}

function* getIdsByType (type) {
  const ids = yield select(state =>
    state.vms
      .get(type)
      .reduce((entityIds, entity, entityId) => {
        entityIds.push(entityId)
        return entityIds
      }, [])
  )
  return ids
}

export function* refreshMainPage ({ shallowFetch, page }) {
  shallowFetch = !!shallowFetch

  // refresh VMs and remove any that haven't been refreshed
  const fetchedVmIds = yield fetchVmsByCount(getVmsByCount({
    count: page * AppConfiguration.pageLimit,
    shallowFetch,
  }))

  const vmsIds = yield getIdsByType('vms')
  const fetchedDirectlyVmIds =
    (yield all(
      vmsIds
        .filter(vmId => !fetchedVmIds.includes(vmId))
        .map(vmId => call(fetchSingleVm, getSingleVm({ vmId, shallowFetch })))
    ))
      .reduce((vmIds, vm) => { if (vm) vmIds.push(vm.id); return vmIds }, [])

  yield put(removeMissingVms({ vmIdsToPreserve: [ ...fetchedVmIds, ...fetchedDirectlyVmIds ] }))

  // refresh Pools and remove any that haven't been refreshed
  const fetchedPoolIds = yield fetchPoolsByCount(getPoolsByCount({
    count: page * AppConfiguration.pageLimit,
  }))
  const filteredPoolIds = yield getIdsByType('pools')
  const fetchedDirectlyPoolIds =
    (yield all(
      filteredPoolIds
        .filter(poolId => !fetchedPoolIds.includes(poolId))
        .map(poolId => call(fetchSinglePool, getSinglePool({ poolId })))
    ))
      .reduce((poolIds, pool) => { if (pool) poolIds.push(pool.id); return poolIds }, [])

  yield put(removeMissingPools({ poolIdsToPreserve: [ ...fetchedPoolIds, ...fetchedDirectlyPoolIds ] }))

  // update counts
  yield put(updateVmsPoolsCount())
}

function* refreshDetailPage ({ id, onNavigation, onSchedule }) {
  yield selectVmDetail(actionSelectVmDetail({ vmId: id }))
  yield getConsoleOptions(actionGetConsoleOptions({ vmId: id }))

  // Load ISO images on manual refresh click only
  if (!onNavigation && !onSchedule) {
    yield fetchIsoFiles(getIsoFiles())
  }
}

function* refreshDialogPage ({ id, onNavigation, onSchedule }) {
  if (id) {
    yield selectVmDetail(actionSelectVmDetail({ vmId: id }))
  }

  // Load ISO images on manual refresh click only
  if (!onNavigation && !onSchedule) {
    yield fetchIsoFiles(getIsoFiles())
  }
}

function* refreshConsolePage ({ id }) {
  if (id) {
    yield selectVmDetail(actionSelectVmDetail({ vmId: id }))
  }
}

const pagesRefreshers = {
  [MAIN_PAGE_TYPE]: refreshMainPage,
  [DETAIL_PAGE_TYPE]: refreshDetailPage,
  [DIALOG_PAGE_TYPE]: refreshDialogPage,
  [CONSOLE_PAGE_TYPE]: refreshConsolePage,
}

function* refreshData (action) {
  console.log('refreshData(): ', action.payload)

  const currentPage = yield select(state => state.config.get('currentPage'))

  if (currentPage.type !== NO_REFRESH_TYPE) {
    if (currentPage.type === undefined) {
      yield pagesRefreshers[MAIN_PAGE_TYPE](action.payload)
    } else {
      yield pagesRefreshers[currentPage.type](Object.assign({ id: currentPage.id }, action.payload))
    }
  }

  console.log('refreshData(): finished')
}

/**
 * Change the current page type (based on `routes.js`) at the time of navigation to the page.
 */
function* changePage (action) {
  yield put(setCurrentPage(action.payload))
  yield refreshData(refresh({
    onNavigation: true,
    shallowFetch: true,
    page: yield select(state => state.vms.get('page')),
  }))
}

function* fetchVmsByPage (action) {
  const isOvirtGTE42 = yield compareVersionToCurrent({ major: 4, minor: 2 })
  if (isOvirtGTE42) {
    yield fetchVmsByPageV42(action)
  } else {
    yield fetchVmsByPageVLower(action)
  }
  yield put(updateVmsPoolsCount())
}

/**
 * Fetch VMs with additional nested data requested (on ovirt 4.2 and later)
 */
function* fetchVmsByPageV42 (action) {
  const { shallowFetch, page } = action.payload

  action.payload.additional = shallowFetch ? ['graphics_consoles'] : vmFetchAdditionalList

  // TODO: paging: split this call to a loop per up to 25 VMs
  const allVms = yield callExternalAction('getVmsByPage', Api.getVmsByPage, action)
  if (allVms && allVms['vm']) { // array
    const internalVms = allVms.vm.map(vm => Api.vmToInternal({ vm, getSubResources: true }))
    yield put(updateVms({ vms: internalVms, copySubResources: false, page: page }))
    yield fetchUnknownIcons({ vms: internalVms })

    // NOTE: No need to fetch the current=true cdrom info at this point. The cdrom info
    //       is needed on the VM details page and `fetchSingleVm` is called upon entry
    //       to the details page. The `fetchSingleVm` fetch includes loading the
    //       appropriate cdrom info based on the VM's state. See `fetchSingleVm` for more
    //       details.
  }
}

/**
 * Fetch VMs and individually fetch nested data as requested (on ovirt 4.1 and earlier)
 */
function* fetchVmsByPageVLower (action) {
  const { shallowFetch, page } = action.payload

  // TODO: paging: split this call to a loop per up to 25 vms
  const allVms = yield callExternalAction('getVmsByPage', Api.getVmsByPage, action)
  if (allVms && allVms['vm']) { // array
    const internalVms = allVms.vm.map(vm => Api.vmToInternal({ vm }))

    yield put(updateVms({ vms: internalVms, copySubResources: true, page: page }))
    yield fetchUnknownIcons({ vms: internalVms })

    if (!shallowFetch) {
      yield fetchConsoleMetadatas({ vms: internalVms })
      yield fetchDisks({ vms: internalVms })
      yield fetchVmsCdRom({ vms: internalVms, current: false })
      yield fetchVmsNics({ vms: internalVms })
      yield fetchVmsSessions({ vms: internalVms })
      yield fetchVmsSnapshots({ vms: internalVms })
      // TODO: Support <4.2 for statistics?
    } else {
      console.log('getVmsByPage() shallow fetch requested - skipping other resources')
    }
  }
}

/**
 * Fetch a given number of VMs (**action.payload.count**).
 */
function* fetchVmsByCount (action) {
  const isOvirtGTE42 = yield compareVersionToCurrent({ major: 4, minor: 2 })
  if (isOvirtGTE42) {
    return yield fetchVmsByCountV42(action)
  } else {
    return yield fetchVmsByCountVLower(action)
  }
}

function* fetchVmsByCountV42 (action) {
  const { shallowFetch } = action.payload
  const fetchedVmIds = []

  action.payload.additional = shallowFetch ? [ 'graphics_consoles' ] : vmFetchAdditionalList

  const allVms = yield callExternalAction('getVmsByCount', Api.getVmsByCount, action)
  if (allVms && allVms['vm']) { // array
    const internalVms = allVms.vm.map(vm => Api.vmToInternal({ vm, getSubResources: true }))
    internalVms.forEach(vm => fetchedVmIds.push(vm.id))

    yield put(updateVms({ vms: internalVms, copySubResources: true }))
    yield fetchUnknownIcons({ vms: internalVms })

    // NOTE: No need to fetch the current=true cdrom info at this point. See `fetchVmsByPageV42`
    //       or `fetchSingleVm` for more details.
  }
  return fetchedVmIds
}

function* fetchVmsByCountVLower (action) {
  const { shallowFetch } = action.payload
  const fetchedVmIds = []

  // TODO: paging: split this call to a loop per up to 25 vms
  const allVms = yield callExternalAction('getVmsByCount', Api.getVmsByCount, action)
  if (allVms && allVms['vm']) { // array
    const internalVms = allVms.vm.map(vm => Api.vmToInternal({ vm }))
    internalVms.forEach(vm => fetchedVmIds.push(vm.id))

    yield put(updateVms({ vms: internalVms, copySubResources: true }))
    yield fetchUnknownIcons({ vms: internalVms })

    if (!shallowFetch) {
      yield fetchConsoleMetadatas({ vms: internalVms })
      yield fetchDisks({ vms: internalVms })
      yield fetchVmsCdRom({ vms: internalVms, current: false })
      yield fetchVmsNics({ vms: internalVms })
      yield fetchVmsSessions({ vms: internalVms })
      yield fetchVmsSnapshots({ vms: internalVms })
      // TODO: Support <4.2 for statistics?
    } else {
      console.log('fetchVmsByCountVLower() shallow fetch requested - skipping other resources')
    }
  }

  return fetchedVmIds
}

export function* putPermissionsInDisk (disk) {
  disk.permits = yield fetchPermits({ entityType: PermissionsType.DISK_TYPE, id: disk.id })
  disk.canUserEditDisk = canUserEditDisk(disk.permits)
  return disk
}

export function* fetchSingleVm (action) {
  const { vmId, shallowFetch } = action.payload

  const isOvirtGTE42 = compareVersionToCurrent({ major: 4, minor: 2 })
  action.payload.additional = [ 'graphics_consoles' ]
  if (isOvirtGTE42 && !shallowFetch) {
    action.payload.additional = vmFetchAdditionalList
  }

  const vm = yield callExternalAction('getVm', Api.getVm, action, true)
  let internalVm = null
  if (vm && vm.id) {
    const isFilter = yield select(state => state.config.get('filter'))
    internalVm = Api.vmToInternal({ vm, getSubResources: isOvirtGTE42 })

    // If the VM is running, we want to display the current=true cdrom info. Due
    // to an API restriction, current=true cdrom info cannot currently (Aug-2018)
    // be accessed via the additional fetch list on the VM. Fetch it directly.
    if (isOvirtGTE42 && !shallowFetch && internalVm.status === 'up') {
      internalVm.cdrom = yield fetchVmCdRom({ vmId: internalVm.id, current: true })
    }

    if (isOvirtGTE42 && !shallowFetch && !isFilter) {
      internalVm.permits = getUserPermits(yield fetchVmPermissions({ vmId: internalVm.id }))
    }

    if (!isOvirtGTE42 && !shallowFetch) {
      internalVm.cdrom = yield fetchVmCdRom({ vmId: internalVm.id, current: internalVm.status === 'up' })
      internalVm.consoles = yield fetchConsoleVmMeta({ vmId: internalVm.id })
      internalVm.nics = yield fetchVmNics({ vmId: internalVm.id })
      internalVm.disks = yield fetchVmDisks({ vmId: internalVm.id })
      internalVm.sessions = yield fetchVmSessions({ vmId: internalVm.id })
      internalVm.permits = getUserPermits(yield fetchVmPermissions({ vmId: internalVm.id }))
      internalVm.canUserEditVm = canUserEditVm(internalVm.permits)
      internalVm.canUserEditVmStorage = canUserEditVmStorage(internalVm.permits)
      // TODO: Support <4.2 for snapshots?
      // TODO: Support <4.2 for statistics?
    }

    if (!shallowFetch) {
      internalVm.disks = (yield all(internalVm.disks.map(putPermissionsInDisk)))
    }

    // NOTE: Snapshot Disks and Nics are not currently (Sept-2018) available via
    //       additional/follow param on the VM/snapshot fetch.  We need to fetch them
    //       directly.
    for (const snapshot of internalVm.snapshots) {
      const follows = yield all([
        call(fetchVmSnapshotDisks, { vmId: internalVm.id, snapshotId: snapshot.id }),
        call(fetchVmSnapshotNics, { vmId: internalVm.id, snapshotId: snapshot.id }),
      ])
      snapshot.disks = follows[0]
      snapshot.nics = follows[1]
    }

    yield put(updateVms({ vms: [internalVm], copySubResources: shallowFetch }))
    yield fetchUnknownIcons({ vms: [internalVm] })
  } else {
    if (vm && vm.error && vm.error.status === 404) {
      yield put(removeVms({ vmIds: [vmId] }))
    }
  }

  yield put(updateVmsPoolsCount())
  return internalVm
}

function* fetchPoolsByCount (action) {
  const fetchedPoolIds = []

  const allPools = yield callExternalAction('getPoolsByCount', Api.getPoolsByCount, action)
  if (allPools && allPools['vm_pool']) { // array
    const internalPools = allPools.vm_pool.map(pool => Api.poolToInternal({ pool }))
    internalPools.forEach(pool => fetchedPoolIds.push(pool.id))

    yield put(updatePools({ pools: internalPools }))
    yield put(updateVmsPoolsCount())
  }

  return fetchedPoolIds
}

function* fetchPoolsByPage (action) {
  const allPools = yield callExternalAction('getPoolsByPage', Api.getPoolsByPage, action)

  if (allPools && allPools['vm_pool']) { // array
    const internalPools = allPools.vm_pool.map(pool => Api.poolToInternal({ pool }))

    yield put(updatePools({ pools: internalPools }))
    yield put(updateVmsPoolsCount())
  }
}

function* fetchSinglePool (action) {
  const { poolId } = action.payload

  const pool = yield callExternalAction('getPool', Api.getPool, action, true)
  let internalPool = false
  if (pool && pool.id) {
    internalPool = Api.poolToInternal({ pool })
    yield put(updatePools({ pools: [internalPool] }))
  } else {
    if (pool && pool.error && pool.error.status === 404) {
      yield put(removePools({ poolIds: [poolId] }))
    }
  }

  yield put(updateVmsPoolsCount())
  return internalPool
}

function* fetchVmsSessions ({ vms }) {
  yield * foreach(vms, function* (vm) {
    const sessionsInternal = yield fetchVmSessions({ vmId: vm.id })
    yield put(setVmSessions({ vmId: vm.id, sessions: sessionsInternal }))
  })
}

/*
 * Fetch a VM's cdrom configuration based on the status of the VM. A running VM's cdrom
 * info comes from "current=true" while a non-running VM's cdrom info comes from the
 * next_run/"current=false" API parameter.
 */
function* fetchVmCdRom ({ vmId, current }) {
  const cdrom = yield callExternalAction('getCdRom', Api.getCdRom, getVmCdRom({ vmId, current }))

  let cdromInternal = null
  if (cdrom) {
    cdromInternal = Api.cdRomToInternal({ cdrom })
  }
  return cdromInternal
}

/*
 * For each given VM, first fetch the appropriate __current__ cdrom info, then push the
 * info to VM reducers for the redux store.
 */
function* fetchVmsCdRom ({ vms, current }) {
  yield * foreach(vms, function* (vm) {
    const cdrom = yield fetchVmCdRom({ vmId: vm.id, current })
    yield put(setVmCdRom({ vmId: vm.id, cdrom }))
  })
}

function* fetchConsoleMetadatas ({ vms }) {
  yield * foreach(vms, function* (vm) {
    const consolesInternal = yield fetchConsoleVmMeta({ vmId: vm.id })
    yield put(setVmConsoles({ vmId: vm.id, consoles: consolesInternal }))
  })
}

export function* fetchDisks ({ vms }) {
  yield * foreach(vms, function* (vm) {
    const vmId = vm.id
    const disks = yield fetchVmDisks({ vmId })
    yield put(setVmDisks({ vmId, disks }))
  })
}

function* fetchVmDisks ({ vmId }) {
  // TODO: Enhance to use the `follow` API parameter (in API >=4.2) to reduce the request count
  //       This should follow the same style as `fetchSingleVm` and would require an extension to `Api.diskattachments`
  const diskattachments = yield callExternalAction('diskattachments', Api.diskattachments, { type: 'GET_DISK_ATTACHMENTS', payload: { vmId } })

  if (diskattachments && diskattachments['disk_attachment']) { // array
    const internalDisks = []
    yield * foreach(diskattachments['disk_attachment'], function* (attachment) {
      const diskId = attachment.disk.id
      const disk = yield callExternalAction('disk', Api.disk, { type: 'GET_DISK_DETAILS', payload: { diskId } })
      const internalDisk = yield putPermissionsInDisk(Api.diskToInternal({ disk, attachment }))
      internalDisks.push(internalDisk)
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

function* editVmNic (action) {
  yield callExternalAction('editNicInVm', Api.editNicInVm, action)

  const nicsInternal = yield fetchVmNics({ vmId: action.payload.vmId })
  yield put(setVmNics({ vmId: action.payload.vmId, nics: nicsInternal }))
}

export function* startProgress ({ vmId, poolId, name }) {
  if (vmId) {
    yield put(vmActionInProgress({ vmId, name, started: true }))
  } else {
    yield put(poolActionInProgress({ poolId, name, started: true }))
  }
}

function* getSingleInstance ({ vmId, poolId }) {
  const fetches = [ fetchSingleVm(getSingleVm({ vmId })) ]
  if (poolId) {
    fetches.push(fetchSinglePool(getSinglePool({ poolId })))
  }
  yield all(fetches)
}

export function* stopProgress ({ vmId, poolId, name, result }) {
  const actionInProgress = vmId ? vmActionInProgress : poolActionInProgress
  if (result && result.status === 'complete') {
    vmId = vmId || result.vm.id
    // do not call 'end of in progress' if successful,
    // since UI will be updated by refresh
    yield delay(5 * 1000)
    yield getSingleInstance({ vmId, poolId })

    yield delay(30 * 1000)
    yield getSingleInstance({ vmId, poolId })
  }

  yield put(actionInProgress(Object.assign(vmId ? { vmId } : { poolId }, { name, started: false })))
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

export function* createVm (action) {
  const result = yield callExternalAction('addNewVm', Api.addNewVm, action)

  if (!result.error) {
    const vmId = result.id
    yield put(actionSelectVmDetail({ vmId }))

    if (action.payload.pushToDetailsOnSuccess) {
      yield put(push(`/vm/${vmId}`))
    }
  }

  return result
}

/*
 * Edit a VM by pushing (with a full or partial VM definition) VM updates, and if
 * new cdrom info is provided, change the cdrom as appropriate for the VM's status. A
 * running VM will have its current=true cdrom updated (to make the change immediate).
 * A non-running VM will have its current=false cdrom updated (to make the change apply
 * at next_run).
 */
export function* editVm (action) {
  const { payload: { vm } } = action
  const vmId = vm.id
  const onlyNeedChangeCd = vm && arrayMatch(Object.keys(vm), [ 'id', 'cdrom' ])

  const editVmResult = onlyNeedChangeCd
    ? {}
    : yield callExternalAction('editVm', Api.editVm, action)

  let commitError = editVmResult.error
  if (!commitError && vm.cdrom) {
    const changeCdResult = yield changeVmCdRom(actionChangeVmCdRom({
      vmId,
      cdrom: vm.cdrom,
      current: action.payload.changeCurrentCd,
      updateRedux: false, // the 'actionSelectVmDetail' will fetch the cd-rom update
    }))

    commitError = changeCdResult.error
  }

  if (!commitError) {
    // deep fetch refresh the VM with any/all updates applied
    yield put(actionSelectVmDetail({ vmId }))
  }

  if (action.meta && action.meta.correlationId) {
    yield put(setVmActionResult({
      vmId,
      correlationId: action.meta.correlationId,
      result: !commitError,
    }))
  }

  if (!commitError && action.payload.restartAfterEdit) {
    yield put(actionRestartVm({ vmId })) // non-blocking restart
  }
}

export function* changeVmCdRom (action) {
  const result = yield callExternalAction('changeCdRom', Api.changeCdRom, action)

  if (!result.error && action.payload.updateRedux) {
    yield put(setVmCdRom({
      vmId: action.payload.vm.id,
      cdrom: Api.cdRomToInternal(result),
    }))
  }

  if (action.meta && action.meta.correlationId) {
    yield put(setVmActionResult({
      vmId: action.payload.vm.id,
      correlationId: action.meta.correlationId,
      result: !result.error,
    }))
  }

  return result
}

function* removeVm (action) {
  yield startProgress({ vmId: action.payload.vmId, name: 'remove' })
  const result = yield callExternalAction('remove', Api.remove, action)

  if (result.status === 'complete') {
    // TODO: Remove the VM from the store so we don't see it on the list page!
    yield put(push('/'))
  }

  yield stopProgress({ vmId: action.payload.vmId, name: 'remove', result })
}

function* fetchAllEvents (action) {
  const user = yield select(state => ({
    id: state.config.getIn(['user', 'id']),
    name: `${state.config.getIn(['user', 'name'])}@${state.config.get('domain')}`,
  }))

  const events = yield callExternalAction('events', Api.events, { payload: {} })

  if (events.error) {
    return
  }

  const internalEvents = events.event
    ? events.event
      .filter((event) =>
        event.severity === 'error' &&
        event.user &&
        (event.user.id === user.id || event.user.name === user.name)
      )
      .map((event) => Api.eventToInternal({ event }))
    : []
  yield put(setUserMessages({ messages: internalEvents }))
}

function* dismissEvent (action) {
  const { event } = action.payload
  if (event.id) {
    const result = yield callExternalAction('dismissEvent', Api.dismissEvent, { payload: { eventId: event.id } })

    if (result.status === 'complete') {
      yield fetchAllEvents(action)
    }
  } else {
    yield put(dismissUserMessage({ time: event.get('time') }))
  }
}

function* clearEvents (action) {
  const user = yield select(state => ({
    id: state.config.getIn(['user', 'id']),
    name: `${state.config.getIn(['user', 'name'])}@${state.config.get('domain')}`,
  }))
  const events = yield callExternalAction('events', Api.events, { payload: {} })

  if (events.error) {
    return
  }

  const sagaEvents = events.event
    ? events.event
      .filter((event) =>
        event.severity === 'error' &&
        event.user &&
        (event.user.id === user.id || event.user.name === user.name)
      ).map((event) => callExternalAction('dismissEvent', Api.dismissEvent, { payload: { eventId: event.id } }))
    : []

  yield all(sagaEvents)

  yield fetchAllEvents(action)
}

export function* fetchVmSessions ({ vmId }) {
  const sessions = yield callExternalAction('sessions', Api.sessions, { payload: { vmId } })

  if (sessions && sessions['session']) {
    return Api.sessionsToInternal({ sessions })
  }
  return []
}

export function* fetchVmPermissions ({ vmId }) {
  const permissions = yield callExternalAction('getVmPermissions', Api.getVmPermissions, { payload: { vmId } })

  if (permissions && permissions['permission']) {
    return Api.permissionsToInternal({ permissions: permissions.permission })
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

export function* fetchAllTemplates (action) {
  const templates = yield callExternalAction('getAllTemplates', Api.getAllTemplates, action)

  if (templates && templates['template']) {
    const templatesInternal = (yield all(
      templates.template
        .map(function* (template) {
          const templateInternal = Api.templateToInternal({ template })
          templateInternal.permits = yield fetchPermits({ entityType: PermissionsType.TEMPLATE_TYPE, id: template.id })
          templateInternal.canUserUseTemplate = canUserUseTemplate(templateInternal.permits)
          return templateInternal
        })
    ))
    yield put(setTemplates(templatesInternal))
  }
}

export function* fetchAllClusters (action) {
  const clusters = yield callExternalAction('getAllClusters', Api.getAllClusters, action)

  if (clusters && clusters['cluster']) {
    // Temporary solution, till bug will be fixed https://bugzilla.redhat.com/show_bug.cgi?id=1639784
    let clustersInternal = (yield all(
      clusters.cluster
        .map(function* (cluster) {
          const clusterInternal = Api.clusterToInternal({ cluster })
          clusterInternal.permits = yield fetchPermits({ entityType: PermissionsType.CLUSTER_TYPE, id: cluster.id })
          clusterInternal.canUserUseCluster = canUserUseCluster(clusterInternal.permits)
          return clusterInternal
        })
    ))
    yield put(setClusters(clustersInternal))
  }

  // TODO: Api.getAllClusters uses 'follows' so it won't work <4.2, add support if needed
}

function* saveFilters (actions) {
  const { filters } = actions.payload
  const userId = yield select(state => state.config.getIn(['user', 'id']))
  saveToLocalStorage(`vmFilters-${userId}`, JSON.stringify(filters))
  yield put(setVmsFilters({ filters }))
}

export function* fetchAllHosts (action) {
  const hosts = yield callExternalAction('getAllHosts', Api.getAllHosts, action)

  if (hosts && hosts['host']) {
    const hostsInternal = hosts.host.map(host => Api.hostToInternal({ host }))
    yield put(setHosts(hostsInternal))
  }
}

export function* fetchAllOS (action) {
  const operatingSystems = yield callExternalAction('getAllOperatingSystems', Api.getAllOperatingSystems, action)

  if (operatingSystems && operatingSystems['operating_system']) {
    const operatingSystemsInternal = operatingSystems.operating_system.map(os => Api.OSToInternal({ os }))
    yield put(setOperatingSystems(operatingSystemsInternal))
    yield fetchUnknownIcons({ os: operatingSystemsInternal })
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

function* fetchVmsSnapshots ({ vms }) {
  yield all(vms.map((vm) => call(fetchVmSnapshots, { vmId: vm.id })))
}

export function* fetchVmSnapshots ({ vmId }) {
  const snapshots = yield callExternalAction('snapshots', Api.snapshots, { type: 'GET_VM_SNAPSHOT', payload: { vmId } })
  let snapshotsInternal = []

  if (snapshots && snapshots.snapshot) {
    snapshotsInternal = snapshots.snapshot.map(snapshot => Api.snapshotToInternal({ snapshot }))

    // NOTE: Snapshot Disks and Nics are not currently (Sept-2018) available via
    //       additional/follow param on the snapshot fetch.  We need to fetch them
    //       directly.
    for (const snapshot of snapshotsInternal) {
      const follows = yield all([
        call(fetchVmSnapshotDisks, { vmId, snapshotId: snapshot.id }),
        call(fetchVmSnapshotNics, { vmId, snapshotId: snapshot.id }),
      ])
      snapshot.disks = follows[0]
      snapshot.nics = follows[1]
    }
  }

  yield put(setVmSnapshots({ vmId, snapshots: snapshotsInternal }))
}

function* fetchVmSnapshotDisks ({ vmId, snapshotId }) {
  const disks = yield callExternalAction('snapshotDisks', Api.snapshotDisks, { payload: { vmId, snapshotId } }, true)
  let disksInternal = []
  if (disks && disks.disk) {
    disksInternal = disks.disk.map(disk => Api.diskToInternal({ disk }))
  }
  return disksInternal
}

function* fetchVmSnapshotNics ({ vmId, snapshotId }) {
  const nics = yield callExternalAction('snapshotNics', Api.snapshotNics, { payload: { vmId, snapshotId } }, true)
  let nicsInternal = []
  if (nics && nics.nic) {
    nicsInternal = nics.nic.map((nic) => Api.nicToInternal({ nic }))
  }
  return nicsInternal
}

export function* fetchAllVnicProfiles (action) {
  const vnicProfiles = yield callExternalAction('getAllVnicProfiles', Api.getAllVnicProfiles, action)
  if (vnicProfiles && vnicProfiles['vnic_profile']) {
    // Temporary solution, till bug will be fixed https://bugzilla.redhat.com/show_bug.cgi?id=1639784
    const vnicProfilesInternal = (yield all(
      vnicProfiles.vnic_profile
        .map(function* (vnicProfile) {
          const vnicProfileInternal = Api.vnicProfileToInternal({ vnicProfile })
          vnicProfileInternal.permits = yield fetchPermits({ entityType: PermissionsType.VNIC_PROFILE_TYPE, id: vnicProfile.id })
          vnicProfileInternal.canUserUseProfile = canUserUseVnicProfile(vnicProfileInternal.permits)
          return vnicProfileInternal
        })
    ))
    yield put(setVnicProfiles({ vnicProfiles: vnicProfilesInternal }))
    if (!compareVersionToCurrent({ major: 4, minor: 2 })) {
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

export function* fetchUserGroups () {
  const userId = yield select(state => state.config.getIn(['user', 'id']))
  const groups = yield callExternalAction('groups', Api.groups, { payload: { userId } })
  if (groups && groups['group']) {
    const groupsInternal = groups.group.map(group => group.id)
    groupsInternal.push(EVERYONE_GROUP_ID)
    yield put(setUserGroups({ groups: groupsInternal }))
  }
}

function* delayedRemoveActiveRequest ({ payload: requestId }) {
  yield delay(500)
  yield put(removeActiveRequest(requestId))
}

function* startSchedulerWithFixedDelay (action) {
  // if a scheduler is already running, stop it
  yield put(stopSchedulerFixedDelay())

  // run a new scheduler
  yield schedulerWithFixedDelay(action.payload.delayInSeconds)
}

let _SchedulerCount = 0

function* schedulerWithFixedDelay (delayInSeconds = AppConfiguration.schedulerFixedDelayInSeconds) {
  const myId = _SchedulerCount++
  console.log(`⏰ schedulerWithFixedDelay[${myId}] starting fixed delay scheduler`)

  let enabled = true
  while (enabled) {
    console.log(`⏰ schedulerWithFixedDelay[${myId}] stoppable delay for: ${delayInSeconds}`)
    const { stopped } = yield race({
      stopped: take(STOP_SCHEDULER_FIXED_DELAY),
      fixedDelay: call(delay, (delayInSeconds * 1000)),
    })

    const isTokenExpired = yield select(state => state.config.get('isTokenExpired'))
    if (isTokenExpired) {
      enabled = false
      console.log(`⏰ schedulerWithFixedDelay[${myId}] scheduler has been stopped due token expiration`)
      continue
    }

    if (stopped) {
      enabled = false
      console.log(`⏰ schedulerWithFixedDelay[${myId}] scheduler has been stopped`)
    } else {
      console.log(`⏰ schedulerWithFixedDelay[${myId}] running after delay of: ${delayInSeconds}`)

      const oVirtVersion = yield select(state => state.config.get('oVirtApiVersion'))
      if (oVirtVersion.get('passed')) {
        yield refreshData(refresh({
          onSchedule: true,
          shallowFetch: true,
          page: yield select(state => state.vms.get('page')),
        }))
      } else {
        console.log(`⏰ schedulerWithFixedDelay[${myId}] event skipped since oVirt API version does not match`)
      }
    }
  }
}

export function* rootSaga () {
  yield all([
    ...loginSagas,
    takeLatest(CHECK_TOKEN_EXPIRED, doCheckTokenExpired),
    takeEvery(DELAYED_REMOVE_ACTIVE_REQUEST, delayedRemoveActiveRequest),

    takeEvery(START_SCHEDULER_FIXED_DELAY, startSchedulerWithFixedDelay),
    // STOP_SCHEDULER_FIXED_DELAY is taken by `schedulerWithFixedDelay()`
    throttle(1000, REFRESH_DATA, refreshData),

    throttle(100, GET_BY_PAGE, fetchByPage),
    throttle(100, GET_VMS_BY_PAGE, fetchVmsByPage),
    throttle(100, GET_VMS_BY_COUNT, fetchVmsByCount),
    throttle(100, GET_POOLS_BY_COUNT, fetchPoolsByCount),
    throttle(100, GET_POOLS_BY_PAGE, fetchPoolsByPage),
    takeLatest(CHANGE_PAGE, changePage),

    takeEvery(SHUTDOWN_VM, shutdownVm),
    takeEvery(RESTART_VM, restartVm),
    takeEvery(START_VM, startVm),
    takeEvery(SUSPEND_VM, suspendVm),
    takeEvery(CREATE_VM, createVm),
    takeEvery(EDIT_VM, editVm),
    takeEvery(REMOVE_VM, removeVm),
    takeEvery(CHANGE_VM_CDROM, changeVmCdRom),

    takeEvery(START_POOL, startPool),

    takeEvery(OPEN_CONSOLE_MODAL, openConsoleModal),
    takeEvery(DOWNLOAD_CONSOLE_VM, downloadVmConsole),
    takeEvery(GET_RDP_VM, getRDPVm),

    takeLatest(GET_ALL_CLUSTERS, fetchAllClusters),
    takeLatest(GET_ALL_TEMPLATES, fetchAllTemplates),
    takeLatest(GET_ALL_OS, fetchAllOS),
    takeLatest(GET_ALL_HOSTS, fetchAllHosts),
    takeLatest(GET_ALL_VNIC_PROFILES, fetchAllVnicProfiles),
    takeLatest(GET_USER_GROUPS, fetchUserGroups),

    takeLatest(GET_ALL_EVENTS, fetchAllEvents),
    takeEvery(DISMISS_EVENT, dismissEvent),
    takeEvery(CLEAR_USER_MSGS, clearEvents),

    takeEvery(SELECT_VM_DETAIL, selectVmDetail),
    takeEvery(ADD_VM_NIC, addVmNic),
    takeEvery(DELETE_VM_NIC, deleteVmNic),
    takeEvery(EDIT_VM_NIC, editVmNic),
    takeEvery(GET_CONSOLE_OPTIONS, getConsoleOptions),
    takeEvery(SAVE_CONSOLE_OPTIONS, saveConsoleOptions),

    takeEvery(SAVE_FILTERS, saveFilters),

    takeEvery(SELECT_POOL_DETAIL, selectPoolDetail),

    // Sagas from Components
    ...vmDisksSagas,
    ...storageDomainSagas,
    ...vmSnapshotsSagas,
    ...optionsDialogSagas,
  ])
}
