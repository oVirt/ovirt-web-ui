import { call, put } from 'redux-saga/effects'
import { takeEvery, takeLatest } from 'redux-saga'

// import { browserHistory } from 'react-router'

import Product from './version'
import { logDebug, hidePassword, fileDownload } from './helpers'

import {
  getAllVms,
  loginSuccessful,
  loginFailed,
  failedExternalAction,
  loadInProgress,
  setVmDetailToShow,
  updateIcons,
  setVmDisks,
  updateVms,
  removeVms,
  vmActionInProgress,
  setVmConsoles,
  removeMissingVms,
  persistState,
  getSingleVm,
  setOvirtApiVersion,
} from './actions'

import {
  LOGIN,
  LOGOUT,
  GET_ALL_VMS,
  PERSIST_STATE,
  SHUTDOWN_VM,
  RESTART_VM,
  START_VM,
  GET_CONSOLE_VM,
  SUSPEND_VM,
  SELECT_VM_DETAIL,
  SCHEDULER__1_MIN,
} from './constants'

// import store from './store'
import Api from './ovirtapi'
import { persistStateToLocalStorage } from './storage'
import Selectors from './selectors'
import AppConfiguration from './config'

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
    if (!canBeMissing || e.status !== 404) {
      logDebug(`External action exception: ${JSON.stringify(e)}`)

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
        yield put(getAllVms({ shallowFetch: false }))
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

/*
function* onLoginSuccessful () {
  const redirectUrl = store.getState().router
  browserHistory.replace(redirectUrl)
}
*/

function* logout () {
  window.location.href = `${AppConfiguration.applicationURL}/sso/logout`
//  clearTokenFromSessionStorage()
//  browserHistory.replace('/login')
}

function* fetchUnknwonIconsForVms ({ vms }) {
  // unique iconIds from all vms
  const vmIconIds = new Set(vms.map(vm => vm.icons.small.id))
  vms.map(vm => vm.icons.large.id).forEach(id => vmIconIds.add(id))

  // reduce to just unknown
  const allKnownIcons = Selectors.getAllIcons()
  const iconIds = [...vmIconIds].filter(id => !allKnownIcons.get(id))

  yield * foreach(iconIds, function* (iconId) {
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

function* fetchAllVms (action) {
  const { shallowFetch } = action.payload

  // TODO: paging: split this call to a loop per up to 25 vms
  const allVms = yield callExternalAction('getAllVms', Api.getAllVms, action)

  if (allVms && allVms['vm']) { // array
    const internalVms = allVms.vm.map(vm => Api.vmToInternal({ vm }))

    const vmIdsToPreserve = internalVms.map(vm => vm.id)
    yield put(removeMissingVms({ vmIdsToPreserve }))

    yield put(updateVms({ vms: internalVms, copySubResources: true }))

    // TODO: is removing of icons needed? I.e. when icon is removed or changed on the server
    yield fetchUnknwonIconsForVms({ vms: internalVms })

    if (!shallowFetch) {
      yield fetchConsoleMetadatas({ vms: internalVms })
      yield fetchDisks({ vms: internalVms })
    } else {
      logDebug('fetchAllVms() shallow fetch requested - skipping other resources')
    }
  }

  yield put(loadInProgress({ value: false }))
  yield put(persistState())
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

function* fetchConsoleMetadatas ({ vms }) {
  yield * foreach(vms, function* (vm) {
    const consolesInternal = yield fetchConsoleVmMeta({ vmId: vm.id })
    yield put(setVmConsoles({ vmId: vm.id, consoles: consolesInternal }))
  })
}

function* fetchSingleVm (action) {
  const vm = yield callExternalAction('getVm', Api.getVm, action, true)

  if (vm && vm.id) {
    const internalVm = Api.vmToInternal({ vm })

    internalVm.disks = yield fetchVmDisks({ vmId: internalVm.id })
    internalVm.consoles = yield fetchConsoleVmMeta({ vmId: internalVm.id })

    yield put(updateVms({ vms: [internalVm] }))
  } else {
    if (vm && vm.error && vm.error.status === 404) {
      yield put(removeVms({ vmIds: [action.payload.vmId] }))
    }
  }
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

function* startProgress ({ vmId, name }) {
  yield put(vmActionInProgress({ vmId, name, started: true }))
}

function* stopProgress ({ vmId, name, result }) {
  if (result && result.status === 'complete') {
      // do not call 'end of in progress' if successful,
      // since UI will be updated by refresh
    yield delay(5 * 1000)
    yield fetchSingleVm(getSingleVm({ vmId }))
    yield delay(30 * 1000)
    yield fetchSingleVm(getSingleVm({ vmId }))
  }

  yield put(vmActionInProgress({ vmId, name, started: false }))
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

function* fetchConsoleVmMeta ({ vmId }) {
  const consoles = yield callExternalAction('consoles', Api.consoles, { type: 'INTERNAL_CONSOLES', payload: { vmId } })

  if (consoles && consoles['graphics_console']) { // && consoles['graphics_console'].length > 0) {
    return Api.consolesToInternal({ consoles })
  }
  return []
}

function* getConsoleVm (action) {
  let { vmId, consoleId } = action.payload

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
    const data = yield callExternalAction('console', Api.console, { type: 'INTERNAL_CONSOLE', payload: { vmId, consoleId } })
    if (data.error === undefined) {
      fileDownload({ data, fileName: 'console.vv', mimeType: 'application/x-virt-viewer' })
    }
  }
}

function* selectVmDetail (action) {
  yield put(setVmDetailToShow({ vmId: action.payload.vmId }))
  yield fetchSingleVm(getSingleVm({ vmId: action.payload.vmId }))
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
      // TODO: allow user to enable/disable the autorefresh
      yield put(getAllVms({ shallowFetch: true }))
    } else {
      logDebug('schedulerPerMinute() event skipped since oVirt API version does not match')
    }
  }
}

export function *rootSaga () {
  yield [
    takeEvery(LOGIN, login),
    // takeEvery('LOGIN_SUCCESSFUL', onLoginSuccessful),
    takeEvery(LOGOUT, logout),
    takeLatest(GET_ALL_VMS, fetchAllVms),
    takeLatest(PERSIST_STATE, persistStateSaga),

    takeEvery(SHUTDOWN_VM, shutdownVm),
    takeEvery(RESTART_VM, restartVm),
    takeEvery(START_VM, startVm),
    takeEvery(GET_CONSOLE_VM, getConsoleVm),
    takeEvery(SUSPEND_VM, suspendVm),

    takeEvery(SELECT_VM_DETAIL, selectVmDetail),

    takeLatest(SCHEDULER__1_MIN, schedulerPerMinute),
  ]
}

// TODO: translate
const shortMessages = {
  'START_VM': 'Failed to start the VM',
  'RESTART_VM': 'Failed to restart the VM',
  'SHUTDOWN_VM': 'Failed to shutdown the VM',
  'GET_CONSOLE_VM': 'Failed to get the VM console',
  'SUSPEND_VM': 'Failed to suspend the VM',

  'GET_ICON': 'Failed to retrieve VM icon',
  'INTERNAL_CONSOLE': 'Failed to retrieve VM console details',
  'INTERNAL_CONSOLES': 'Failed to retrieve list of VM consoles',
  'GET_DISK_DETAILS': 'Failed to retrieve disk details',
  'GET_DISK_ATTACHMENTS': 'Failed to retrieve VM disk attachments',
}

function shortErrorMessage ({ action }) {
  return shortMessages[action.type] ? shortMessages[action.type] : `${action.type} failed` // TODO: translate
}
