import {
  call,
  put,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects'

import Product from './version'
import { logDebug, hidePassword, fileDownload } from './helpers'

import {
  loginSuccessful,
  loginFailed,
  failedExternalAction,
  showTokenExpiredMessage,

  loadInProgress,
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
  setOvirtApiVersion,

  getSingleVm,
  getAllTemplates,
  getAllClusters,
  getAllHosts,
  getAllOperatingSystems,
  addClusters,
  addHosts,
  addTemplates,
  addAllOS,

  getSinglePool,
  removeMissingPools,
  removePools,
  updatePools,
  updateVmsPoolsCount,
  poolActionInProgress,

  setUserFilterPermission,
  setAdministrator,
  checkTokenExpired,

  setConsoleOptions,
  redirectRoute,
  refresh,
  downloadConsole,
  getConsoleOptions as getConsoleOptionsAction,
  getVmsByPage,
  getVmsByCount,
  getPoolsByCount,
  getPoolsByPage,
  setStorages,
  removeMissingStorages,
  setFiles,
  setVmCDRom,
  setUSBFilter,
  getUSBFilter,
} from './actions/index'

import {
  CHECK_TOKEN_EXPIRED,
  GET_ALL_CLUSTERS,
  GET_ALL_FILES_FOR_ISO,
  GET_ALL_HOSTS,
  GET_ALL_OS,
  GET_ALL_TEMPLATES,
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

import Api from 'ovirtapi'
import { persistStateToLocalStorage } from './storage'
import Selectors from './selectors'
import AppConfiguration from './config'
import OptionsManager from './optionsManager'
import SagasWorkers from './sagasBuilder'
import RDPBuilder from './rdp-builder'
import { msg } from './intl'

function * foreach (array, fn, context) {
  var i = 0
  var length = array.length

  for (;i < length; i++) {
    yield * fn.call(context, array[i], i, array)
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// TODO: following generators should be better part of the Api -- Revise

function* callExternalAction (methodName, method, action, canBeMissing = false) {
  try {
    logDebug(`External action ${methodName}() starts on ${JSON.stringify(hidePassword({ action }))}`)
    const result = yield call(method, action.payload)
    return result
  } catch (e) {
    if (!canBeMissing) {
      logDebug(`External action exception: ${JSON.stringify(e)}`)

      if (e.status === 401) { // Unauthorized
        yield put(checkTokenExpired())
      }

      let shortMessage = shortErrorMessage({ action })
      if (e.status === 0 && e.statusText === 'error') { // special case, mixing https and http
        shortMessage = 'oVirt API connection failed'
        e.statusText = 'Unable to connect to oVirt REST API. Please check URL and protocol (https).'
      }

      yield put(failedExternalAction({
        exception: e,
        shortMessage,
        action,
      }))
    }
    return { error: e }
  }
}

function* waitTillEqual (leftArg, rightArg, limit) {
  let counter = limit

  const left = typeof leftArg === 'function' ? leftArg : () => leftArg
  const right = typeof rightArg === 'function' ? rightArg : () => rightArg

  while (counter > 0) {
    if (left() === right()) {
      return true
    }
    yield delay(20) // in ms
    counter--

    logDebug('waitTillEqual() delay ...')
  }

  return false
}

function* fetchByPage (action) {
  yield put(loadInProgress({ value: true }))
  yield put(setChanged({ value: false }))
  yield fetchVmsByPage(action)
  yield fetchPoolsByPage(action)
  yield put(loadInProgress({ value: false }))
}

function* persistStateSaga () {
  yield persistStateToLocalStorage({ icons: Selectors.getAllIcons().toJS() })
}

// TODO: implement 'renew the token'
function* login (action) {
  yield put(loadInProgress({ value: true }))

  let token
  let result = {}
  if (action.payload.token) {
    token = action.payload.token
  } else { // recently not used since SSO, TODO: remove
    result = yield callExternalAction('login', Api.login, action)
    if (result && result['access_token']) {
      token = result['access_token']
    }
  }

  if (token) {
    const username = action.payload.credentials.username
    // persistTokenToSessionStorage({ token, username })
    yield put(loginSuccessful({ token, username }))
    const oVirtMeta = yield callExternalAction('getOvirtApiMeta', Api.getOvirtApiMeta, action)
    if (!oVirtMeta['product_info']) { // REST API call failed
      yield put(yield put(loadInProgress({ value: false })))
    } else {
      if (yield checkOvirtApiVersion(oVirtMeta)) {
        yield put(getUSBFilter())
        yield fetchPermissionWithoutFilter({})
        yield autoConnectCheck({})
      } else { // oVirt API of incompatible version
        console.error('oVirt api version check failed')
        yield put(failedExternalAction({
          message: composeIncompatibleOVirtApiVersionMessage(oVirtMeta),
          shortMessage: 'oVirt API version check failed' }))
        yield put(yield put(loadInProgress({ value: false })))
      }
    }
  } else {
    yield put(loginFailed({
      errorCode: result['error_code'] ? result['error_code'] : 'no_access',
      message: result['error'] ? (result.error['statusText'] ? result.error['statusText'] : JSON.stringify(result['error'])) : 'Login Failed',
    }))
    yield put(yield put(loadInProgress({ value: false })))
  }
}

function* doCheckTokenExpired (action) {
  try {
    yield call(Api.getOvirtApiMeta, action.payload)
    console.info('doCheckTokenExpired(): token is still valid') // info level: to pair former HTTP 401 error message with updated information
    return
  } catch (error) {
    if (error.status === 401) {
      console.info('Token expired, going to reload the page')
      yield put(showTokenExpiredMessage())

      // Reload the page after a delay
      // No matter saga is canceled for whatever reason, the reload must happen, so here comes the ugly setTimeout()
      setTimeout(() => {
        console.info('======= doCheckTokenExpired() issuing page reload')
        // window.top.location.reload(true)
        window.location.href = AppConfiguration.applicationURL
      }, 5 * 1000)
      return
    }
    console.error('doCheckTokenExpired(): unexpected oVirt API error: ', error)
  }
}

function composeIncompatibleOVirtApiVersionMessage (oVirtMeta) {
  const requested = `${Product.ovirtApiVersionRequired.major}.${Product.ovirtApiVersionRequired.minor}`
  let found
  if (!(oVirtMeta && oVirtMeta['product_info'] && oVirtMeta['product_info']['version'] &&
    oVirtMeta['product_info']['version']['major'] && oVirtMeta['product_info']['version']['minor'])) {
    found = JSON.stringify(oVirtMeta)
  } else {
    const version = oVirtMeta['product_info']['version']
    found = `${version.major}.${version.minor}`
  }
  return `oVirt API version requested >= ${requested}, but ${found} found`
}

function compareVersion (actual, required) {
  logDebug(`compareVersion(), actual=${JSON.stringify(actual)}, required=${JSON.stringify(required)}`)

  // assuming backward compatibility of oVirt API
  if (actual.major >= required.major) {
    if (actual.major === required.major) {
      if (actual.minor < required.minor) {
        return false
      }
    }
    return true
  }
  return false
}

function* checkOvirtApiVersion (oVirtMeta) {
  if (!(oVirtMeta && oVirtMeta['product_info'] && oVirtMeta['product_info']['version'] &&
    oVirtMeta['product_info']['version']['major'] && oVirtMeta['product_info']['version']['minor'])) {
    console.error('Incompatible oVirt API version: ', oVirtMeta)
    yield put(setOvirtApiVersion({ passed: false, ...oVirtMeta }))
    return false
  }

  const actual = oVirtMeta['product_info']['version']

  const required = Product.ovirtApiVersionRequired
  const passed = compareVersion({ major: parseInt(actual.major), minor: parseInt(actual.minor) }, required)

  yield put(setOvirtApiVersion({ passed, ...actual }))

  return passed
}

function* logout () {
  window.location.href = `${AppConfiguration.applicationURL}/sso/logout`
}

function* fetchUnknwonIconsForVms ({ vms, os }) {
  // unique iconIds from all vms or os (if available)
  const iconsIds = new Set()
  if (vms) {
    vms.map(vm => vm.icons.small.id).forEach(id => iconsIds.add(id))
    vms.map(vm => vm.icons.large.id).forEach(id => iconsIds.add(id))
  }

  if (os) {
    os.map(os => os.icons.small.id).forEach(id => iconsIds.add(id))
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
    console.log('refreshData(): not quiet')
    yield put(loadInProgress({ value: true }))
  }
  yield put(getVmsByCount({ count: action.payload.page * AppConfiguration.pageLimit, shallowFetch: !!action.payload.shallowFetch }))
  yield put(getPoolsByCount({ count: action.payload.page * AppConfiguration.pageLimit }))
  yield put(loadInProgress({ value: false }))
}

function* fetchVmsByPage (action) {
  const { shallowFetch, page } = action.payload

  // TODO: paging: split this call to a loop per up to 25 vms
  const allVms = yield callExternalAction('getVmsByPage', Api.getVmsByPage, action)

  if (allVms && allVms['vm']) { // array
    const internalVms = allVms.vm.map(vm => Api.vmToInternal({ vm }))

    yield put(updateVms({ vms: internalVms, copySubResources: true, page: page }))

    if (!shallowFetch) {
      yield fetchConsoleMetadatas({ vms: internalVms })
      yield fetchDisks({ vms: internalVms })
      yield fetchVmsSessions({ vms: internalVms })
      yield fetchVmsCDRom({ vms: internalVms })
    } else {
      logDebug('getVmsByPage() shallow fetch requested - skipping other resources')
    }
  }

  yield put(persistState())
}

function* fetchVmsByCount (action) {
  const { shallowFetch } = action.payload

  // TODO: paging: split this call to a loop per up to 25 vms
  const allVms = yield callExternalAction('getVmsByCount', Api.getVmsByCount, action)

  if (allVms && allVms['vm']) { // array
    const internalVms = allVms.vm.map(vm => Api.vmToInternal({ vm }))

    const vmIdsToPreserve = internalVms.map(vm => vm.id)
    yield put(removeMissingVms({ vmIdsToPreserve }))

    yield put(updateVms({ vms: internalVms, copySubResources: true }))

    if (!shallowFetch) {
      yield fetchConsoleMetadatas({ vms: internalVms })
      yield fetchDisks({ vms: internalVms })
      yield fetchVmsSessions({ vms: internalVms })
      yield fetchVmsCDRom({ vms: internalVms })
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

    yield put(updateVms({ vms: [internalVm] }))
    yield fetchUnknwonIconsForVms({ vms: [internalVm] })
  } else {
    if (vm && vm.error && vm.error.status === 404) {
      yield put(removeVms({ vmIds: [action.payload.vmId] }))
    }
  }
  yield stopProgress({ vmId: action.payload.vmId, name: 'refresh_single' })

  yield put(updateVmsPoolsCount())
}

function* fetchDisks ({ vms }) {
  yield * foreach(vms, function* (vm) {
    const vmId = vm.id
    const disks = yield fetchVmDisks({ vmId })
    if (disks && disks.length > 0) {
      yield put(setVmDisks({ vmId, disks }))
    }
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

function* fetchConsoleVmMeta ({ vmId }) {
  const consoles = yield callExternalAction('consoles', Api.consoles, { type: 'INTERNAL_CONSOLES', payload: { vmId } })

  if (consoles && consoles['graphics_console']) { // && consoles['graphics_console'].length > 0) {
    return Api.consolesToInternal({ consoles })
  }
  return []
}

function* fetchVmSessions ({ vmId }) {
  const sessions = yield callExternalAction('sessions', Api.sessions, { payload: { vmId } })

  if (sessions && sessions['session']) {
    return Api.sessionsToInternal({ sessions })
  }
  return []
}

function adjustVVFile ({ data, options, usbFilter }) {
  // to simplify other flow, let's handle both 'options' from redux (immutableJs) or plain JS object from getConsoleOptions()
  // logDebug('adjustVVFile data before: ', data)
  logDebug('adjustVVFile options: ', options)

  if (options && (options.get && options.get('fullscreen') || options.fullscreen)) {
    data = data.replace(/^fullscreen=0/mg, 'fullscreen=1')
  }

  const pattern = /^secure-attention=.*$/mg
  let text = 'secure-attention=ctrl+alt+del'
  if (options && (options.get && options.get('ctrlAltDelToEnd') || options.ctrlAltDelToEnd)) {
    text = 'secure-attention=ctrl+alt+end'
  }
  if (data.match(pattern)) {
    logDebug('secure-attention found, replacing by ', text)
    data = data.replace(pattern, text)
  } else {
    logDebug('secure-attention was not found, inserting ', text)
    data = data.replace(/^\[virt-viewer\]$/mg, `[virt-viewer]\n${text}`) // ending \n is already there
  }
  if (usbFilter) {
    data = data.replace(/^\[virt-viewer\]$/mg, `[virt-viewer]\nusb-filter=${usbFilter}`)
  }
  logDebug('adjustVVFile data after adjustment: ', data)
  return data
}

function* downloadVmConsole (action) {
  let { vmId, consoleId, usbFilter } = action.payload

  if (!consoleId) {
    yield put(vmActionInProgress({ vmId, name: 'getConsole', started: true }))
    const consolesInternal = yield fetchConsoleVmMeta({ vmId }) // refresh metadata
    yield put(setVmConsoles({ vmId, consoles: consolesInternal }))
    yield put(vmActionInProgress({ vmId, name: 'getConsole', started: false }))

    // TODO: choose user default over just 'SPICE'
    if (consolesInternal && consolesInternal.length > 0) {
      let console = consolesInternal.find(c => c.protocol === 'spice') || consolesInternal[0]
      consoleId = console.id
    }
  }

  if (consoleId) {
    let data = yield callExternalAction('console', Api.console, { type: 'INTERNAL_CONSOLE', payload: { vmId, consoleId } })

    if (data.error === undefined) {
      let options = Selectors.getConsoleOptions({ vmId })
      if (!options) {
        logDebug('downloadVmConsole() console options not yet present, trying to load from local storage')
        options = yield getConsoleOptions(getConsoleOptionsAction({ vmId }))
      }

      data = adjustVVFile({ data, options, usbFilter })
      fileDownload({ data, fileName: 'console.vv', mimeType: 'application/x-virt-viewer' })
    }
  }
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

function* getConsoleOptions (action) {
  const options = OptionsManager.loadConsoleOptions(action.payload)
  yield put(setConsoleOptions({ vmId: action.payload.vmId, options }))
  return options
}

function* saveConsoleOptions (action) {
  OptionsManager.saveConsoleOptions(action.payload)
  yield getConsoleOptions(getConsoleOptionsAction({ vmId: action.payload.vmId }))
}

function* autoConnectCheck (action) {
  const vmId = OptionsManager.loadAutoConnectOption()
  if (vmId && vmId.length > 0) {
    const vm = yield callExternalAction('getVm', Api.getVm, getSingleVm({ vmId }), true)
    if (vm && vm.id && vm.status !== 'down') {
      const internalVm = Api.vmToInternal({ vm })
      yield put(updateVms({ vms: [internalVm] }))

      yield downloadVmConsole(downloadConsole({ vmId }))
    }
  }
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
    yield fetchUnknwonIconsForVms({ os: operatingSystemsInternal })
    yield put(removeMissingOSs({ osIdsToPreserve }))
  }
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

function* fetchPermissionWithoutFilter (action) {
  const data = yield callExternalAction('checkFilter', Api.checkFilter, { action: 'CHECK_FILTER' }, true)

  // this must be processed before continuing with next steps
  const isFiltered = data.error !== undefined
  yield put(setUserFilterPermission(isFiltered))
  yield waitTillEqual(Selectors.getFilter, isFiltered, 50)

  yield put(setUserFilterPermission(data.error !== undefined))
  yield put(getAllClusters()) // no shallow
  yield put(getAllHosts())
  yield put(getAllOperatingSystems())
  yield put(getAllTemplates({ shallowFetch: false }))
  yield put(getVmsByPage({ page: 1 }))
  yield put(getPoolsByPage({ page: 1 }))
  yield put(setAdministrator(data.error === undefined))
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
      yield put(refresh({ quiet: true, shallowFetch: true, page: Selectors.getCurrentPage() }))
    } else {
      logDebug('schedulerPerMinute() event skipped since oVirt API version does not match')
    }
  }
}

// Sagas workers for using in different sagas modules
let sagasFunctions = {
  foreach,
  callExternalAction,
  fetchVmSessions,
  fetchSingleVm,
}

function* getRDPVm (action) {
  const rdpBuilder = new RDPBuilder(action.payload)
  const data = rdpBuilder.buildRDP()
  fileDownload({ data, fileName: 'console.rdp', mimeType: 'application/rdp' })
}

export function *rootSaga () {
  yield [
    takeEvery(LOGIN, login),
    takeEvery(LOGOUT, logout),
    takeLatest(CHECK_TOKEN_EXPIRED, doCheckTokenExpired),

    takeLatest(REFRESH_DATA, refreshData),
    takeLatest(GET_BY_PAGE, fetchByPage),
    takeLatest(GET_VMS_BY_PAGE, fetchVmsByPage),
    takeLatest(GET_VMS_BY_COUNT, fetchVmsByCount),
    takeLatest(GET_POOLS_BY_COUNT, fetchPoolsByCount),
    takeLatest(GET_POOLS_BY_PAGE, fetchPoolsByPage),
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
    takeLatest(GET_ALL_OS, fetchAllOS),
    takeLatest(GET_ALL_HOSTS, fetchAllHosts),
    takeLatest(GET_ISO_STORAGES, fetchISOStorages),
    takeLatest(GET_ALL_FILES_FOR_ISO, fetchAllFilesForISO),

    takeEvery(SELECT_VM_DETAIL, selectVmDetail),
    takeEvery(GET_CONSOLE_OPTIONS, getConsoleOptions),
    takeEvery(SAVE_CONSOLE_OPTIONS, saveConsoleOptions),

    takeEvery(SELECT_POOL_DETAIL, selectPoolDetail),
    takeEvery(GET_USB_FILTER, fetchUSBFilter),
    takeLatest(SCHEDULER__1_MIN, schedulerPerMinute),
    ...SagasWorkers(sagasFunctions),
  ]
}

const shortMessages = {
  'START_VM': msg.failedToStartVm(),
  'RESTART_VM': msg.failedToRestartVm(),
  'SHUTDOWN_VM': msg.failedToShutdownVm(),
  'DOWNLOAD_CONSOLE_VM': msg.failedToGetVmConsole(),
  'SUSPEND_VM': msg.failedToSuspendVm(),
  'REMOVE_VM': msg.failedToRemoveVm(),

  'GET_ICON': msg.failedToRetrieveVmIcon(),
  'INTERNAL_CONSOLE': msg.failedToRetrieveVmConsoleDetails(),
  'INTERNAL_CONSOLES': msg.failedToRetrieveListOfVmConsoles(),
  'GET_DISK_DETAILS': msg.failedToRetrieveDiskDetails(),
  'GET_DISK_ATTACHMENTS': msg.failedToRetrieveVmDiskAttachments(),
  'GET_ISO_STORAGES': msg.failedToRetrieveIsoStorages(),
  'GET_ALL_FILES_FOR_ISO': msg.failedToRetrieveFilesFromStorage(),

  'GET_VM': msg.failedToRetrieveVmDetails(),
}

function shortErrorMessage ({ action }) {
  return shortMessages[action.type] ? shortMessages[action.type] : msg.actionFailed(action.type)
}
