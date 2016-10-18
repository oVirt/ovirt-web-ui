import { call, put } from 'redux-saga/effects'
import {takeEvery, takeLatest} from 'redux-saga'

import {logDebug, hidePassword, fileDownload} from 'ovirt-ui-components'
import {getAllVms, loginSuccessful, loginFailed, failedExternalAction, loadInProgress,
  updateIcon, updateVmDisk, updateVms, vmActionInProgress} from 'ovirt-ui-components'

import {getVmDisks, getIcon} from './actions'

import Api from './ovirtapi'

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
    yield put(failedExternalAction({exception: e, action}))
    return {error: e}
  }
}

// TODO: implement 'renew the token'
function* login (action) {
  yield put(loadInProgress({value: true}))
  const token = yield callExternalAction('login', Api.login, action)
  if (token && token['access_token']) {
    yield put(loginSuccessful({token, username: action.payload.credentials.username}))
    yield put(getAllVms())
  } else {
    // logDebug(`login(): received data: ${JSON.stringify(token)}`)

    yield put(loginFailed({
      errorCode: token['error_code'] ? token['error_code'] : 'no_access',
      message: token['error'] ? (token.error['statusText'] ? token.error['statusText'] : JSON.stringify(token['error']))  : 'Login Failed'
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
