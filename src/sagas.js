import { call, put } from 'redux-saga/effects'
import {takeEvery, takeLatest} from 'redux-saga'

import {logDebug, hidePassword, fileDownload} from 'ovirt-ui-components'
import {getAllVms, loginSuccessful, loginFailed, failedExternalAction, loadInProgress,
  updateIcon, updateVmDisk, updateVms, vmActionInProgress} from 'ovirt-ui-components'

import { getVmDisks, getIcon } from './actions'
import Api from './ovirtapi'
import { saveToSessionStorage } from './helpers'

function * foreach (array, fn, context) {
  var i = 0
  var length = array.length

  for (;i < length; i++) {
    yield * fn.call(context, array[i], i, array)
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// TODO: following generators should be better part of the Api -- Revise

function* callExternalAction(methodName, method, action) {
  try {
    logDebug(`External action ${methodName}() starts on ${JSON.stringify(hidePassword({action}))}`)
    const result = yield call(method, action.payload)
    return result
  } catch (e) {
    logDebug(`External action exception: ${JSON.stringify(e)}`)
    yield put(failedExternalAction({exception: e, shortMessage: shortErrorMessage({action}), action}))
    return {error: e}
  }
}

// TODO: implement 'renew the token'
function* login (action) {
  yield put(loadInProgress({value: true}))

  let token
  let result = {}
  if (action.payload.token) {
    token = action.payload.token
  } else {
    result = yield callExternalAction('login', Api.login, action)
    if (result && result['access_token']) {
      token = result['access_token']
    }
  }

  if (token) {
    const username = action.payload.credentials.username
    saveToSessionStorage('TOKEN', token)
    saveToSessionStorage('USERNAME', username)

    yield put(loginSuccessful({token, username}))
    yield put(getAllVms())
  } else {
    yield put(loginFailed({
      errorCode: result['error_code'] ? result['error_code'] : 'no_access',
      message: result['error'] ? (result.error['statusText'] ? result.error['statusText'] : JSON.stringify(result['error']))  : 'Login Failed'
    }))
    yield put(yield put(loadInProgress({value: false})))
  }
}

function* fetchAllVms (action) {
  const allVms = yield callExternalAction('getAllVms', Api.getAllVms, action)

  if (allVms && allVms['vm']) { // array
    const internalVms = allVms.vm.map( vm => Api.vmToInternal({vm}))

    yield put(updateVms({vms: internalVms}))
    yield call(delay, 1) // allow rendering

    // TODO: call remove MissgingVMs (those not present in the allVms['vms']) if refresh

    const iconIds = new Set( internalVms.map( vm => vm.icons.small.id) )
    internalVms.map( vm => vm.icons.large.id).forEach( id => iconIds.add(id) )
    yield* foreach([...iconIds], function* (iconId) { // WRONG
      // TODO: check if exists if refresh
      yield put(getIcon({iconId}))
    })
    yield call(delay, 1) // allow rendering

    yield* foreach(internalVms, function* (vm) {
      yield put(getVmDisks({vmId: vm.id}))
    })
    yield call(delay, 1) // allow rendering
  }

  yield put(loadInProgress({value: false}))
}

function* fetchIcon (action) {
  const { iconId } = action.payload

  if (iconId) {
    const icon = yield callExternalAction('icon', Api.icon, {payload: {id: iconId}})
    if (icon['media_type'] && icon['data']) {
      yield put(updateIcon({icon: Api.iconToInternal({icon})}))
    }
  }
}

function* fetchVmDisks(action) {
  const {vmId} = action.payload

  const diskattachments = yield callExternalAction('diskattachments', Api.diskattachments, {payload: {vmId}})

  // TODO: call clearVmDisks if refresh
  if (diskattachments && diskattachments['disk_attachment']) { // array
    yield* foreach(diskattachments['disk_attachment'], function* (attachment) {
      const diskId = attachment.disk.id
      const disk = yield callExternalAction('disk', Api.disk, {payload: {diskId}})

      const internalDisk = Api.diskToInternal({disk, attachment})
      yield put(updateVmDisk({vmId, disk: internalDisk}))
    })
  }
}

function* inProgress({vmId, name, started = true, result}) {
  logDebug(`--- inProgress called: name: ${name}, started: ${started}, result: ${JSON.stringify(result)}`)
  if (!started) {
    if (result && result.status === 'complete') {
      // do not call 'end of in progress' if successful
      return
    }
  }

  yield put(vmActionInProgress({vmId, name, started}))
}

function* shutdownVm (action) {
  yield inProgress({vmId: action.payload.vmId, name: 'shutdown'})
  const result = yield callExternalAction('shutdown', Api.shutdown, action)
  yield inProgress({vmId: action.payload.vmId, name: 'shutdown', started: false, result})
}

function* restartVm (action) {
  yield inProgress({vmId: action.payload.vmId, name: 'restart'})
  const result = yield callExternalAction('restart', Api.restart, action)
  yield inProgress({vmId: action.payload.vmId, name: 'restart', started: false, result})
}

function* suspendVm (action) {
  yield inProgress({vmId: action.payload.vmId, name: 'suspend'})
  const result = yield callExternalAction('suspend', Api.suspend, action)
  yield inProgress({vmId: action.payload.vmId, name: 'suspend', started: false, result})
}

function* startVm (action) {
  yield inProgress({vmId: action.payload.vmId, name: 'start'})
  const result = yield callExternalAction('start', Api.start, action)
  yield inProgress({vmId: action.payload.vmId, name: 'start', started: false, result})
}

function* getConsoleVm (action) {
  yield put(vmActionInProgress({vmId: action.payload.vmId, name: 'getConsole', started: true}))
  const consoles = yield callExternalAction('consoles', Api.consoles, action)
  yield put(vmActionInProgress({vmId: action.payload.vmId, name: 'getConsole', started: false}))

  if (consoles && consoles['graphics_console'] && consoles['graphics_console'].length > 0) {
    let console = consoles['graphics_console'].find( c => 'spice' === c.protocol) || consoles['graphics_console'][0]
    const data = yield callExternalAction('console', Api.console, {action: 'INTERNAL_CONSOLE', payload: {vmId: action.payload.vmId, consoleId: console.id}})
    fileDownload({data, fileName: 'console.vv', mimeType: 'application/x-virt-viewer'})
  }
}

export function *rootSaga () {
  yield [
    takeEvery("LOGIN", login),
    takeLatest("GET_ALL_VMS", fetchAllVms),
    takeEvery("GET_VM_ICON", fetchIcon),
    takeEvery("GET_VM_DISKS", fetchVmDisks),
    takeEvery("SHUTDOWN_VM", shutdownVm),
    takeEvery("RESTART_VM", restartVm),
    takeEvery("START_VM", startVm),
    takeEvery("GET_CONSOLE_VM", getConsoleVm),
    takeEvery("SUSPEND_VM", suspendVm)
  ]
}

// TODO: translate
// TODO: move to ovirt-ui-actions
const shortMessages = {
  'START_VM': 'Failed to start the VM',
  'RESTART_VM': 'Failed to restart the VM',
  'SHUTDOWN_VM': 'Failed to shutdown the VM',
  'GET_CONSOLE_VM': 'Failed to get the VM console',
  'SUSPEND_VM': 'Failed to suspend the VM',
}

function shortErrorMessage({action}) {
  return shortMessages[action.type] ? shortMessages[action.type] :`${action.type} failed` // TODO: translate
}
