import { call, put } from 'redux-saga/effects'
import {takeEvery, takeLatest} from 'redux-saga'

import {logDebug, hidePassword, fileDownload} from 'ovirt-ui-components'
import {getAllVms, loginSuccessful, loginFailed, failedExternalAction, loadInProgress,
  updateIcons, updateVmDisk, clearVmDisks, updateVms, removeVms, removeMissingVms, vmActionInProgress} from 'ovirt-ui-components'

import { persistState, getSingleVm } from './actions'
import Api from './ovirtapi'
import { persistStateToLocalStorage, persistTokenToSessionStorage } from './storage'
import Selectors from './selectors'

function * foreach (array, fn, context) {
  var i = 0
  var length = array.length

  for (;i < length; i++) {
    yield * fn.call(context, array[i], i, array)
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// TODO: following generators should be better part of the Api -- Revise

function* callExternalAction(methodName, method, action, canBeMissing = false) {
  try {
    logDebug(`External action ${methodName}() starts on ${JSON.stringify(hidePassword({action}))}`)
    const result = yield call(method, action.payload)
    return result
  } catch (e) {
    if (!canBeMissing || e.status !== 404) {
      logDebug(`External action exception: ${JSON.stringify(e)}`)
      yield put(failedExternalAction({exception: e, shortMessage: shortErrorMessage({action}), action}))
    }
    return {error: e}
  }
}

function* persistStateSaga () {
  yield persistStateToLocalStorage({icons: Selectors.getAllIcons().toJS()})
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
    persistTokenToSessionStorage({token, username})

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

function* fetchUnknwonIconsForVms ({vms}) {
  // unique iconIds from all vms
  const vmIconIds = new Set( vms.map( vm => vm.icons.small.id) )
  vms.map( vm => vm.icons.large.id).forEach( id => vmIconIds.add(id) )

  // reduce to just unknown
  const allKnownIcons = Selectors.getAllIcons()
  const iconIds = [...vmIconIds].filter( id => !allKnownIcons.get(id))

  yield* foreach(iconIds, function* (iconId) {
    yield fetchIcon({iconId})
  })
}

function* fetchIcon ({ iconId }) {
  if (iconId) {
    const icon = yield callExternalAction('icon', Api.icon, {payload: {id: iconId}})
    if (icon['media_type'] && icon['data']) {
      yield put(updateIcons({icons: [Api.iconToInternal({icon})]}))
    }
  }
}

function* fetchAllVms (action) {
  // TODO: paging: split this call to a loop per up to 25 vms
  const allVms = yield callExternalAction('getAllVms', Api.getAllVms, action)

  if (allVms && allVms['vm']) { // array
    const internalVms = allVms.vm.map( vm => Api.vmToInternal({vm}))

    const vmIdsToPreserve = internalVms.map(vm => vm.id)
    yield put(removeMissingVms({vmIdsToPreserve}))

    yield put(updateVms({vms: internalVms}))

    // TODO: is removing of icons needed? I.e. when icon is removed or changed on the server
    yield fetchUnknwonIconsForVms({vms: internalVms})
    yield fetchDisks({vms: internalVms})
  }

  yield put(loadInProgress({value: false}))
  yield put(persistState())
}

function* fetchDisks({vms}) {
  yield* foreach(vms, function* (vm) {
    yield fetchVmDisks({vmId: vm.id})
  })
}

function* fetchSingleVm (action) {
  const vm = yield callExternalAction('getVm', Api.getVm, action, true)

  if (vm && vm.id) {
    const internalVm = Api.vmToInternal({vm})
    yield put(updateVms({vms: [internalVm]}))
  } else {
    if (vm && vm.error && vm.error.status === 404) {
      yield put(removeVms({vmIds: [action.payload.vmId]}))
    }
  }
}

function* fetchVmDisks({vmId}) {
  const diskattachments = yield callExternalAction('diskattachments', Api.diskattachments, {payload: {vmId}})

  if (diskattachments && diskattachments['disk_attachment']) { // array
    yield put(clearVmDisks({ vmId }))

    yield* foreach(diskattachments['disk_attachment'], function* (attachment) {
      const diskId = attachment.disk.id
      const disk = yield callExternalAction('disk', Api.disk, {payload: {diskId}})

      const internalDisk = Api.diskToInternal({disk, attachment})
      yield put(updateVmDisk({vmId, disk: internalDisk}))
    })
  }
}

function* startProgress ({ vmId, name }) {
  yield put(vmActionInProgress({vmId, name, started: true}))
}

function* stopProgress({ vmId, name, result }) {
    if (result && result.status === 'complete') {
      // do not call 'end of in progress' if successful,
      // since UI will be updated by refresh

      // TODO: correlate
      yield delay(5 * 1000)
      yield fetchSingleVm(getSingleVm({vmId}))
      yield delay(30 * 1000)
      yield fetchSingleVm(getSingleVm({vmId}))
      yield delay(3 * 60 * 1000) // 3 minutes
      yield fetchSingleVm(getSingleVm({vmId}))
    }

  yield put(vmActionInProgress({vmId, name, started: false}))
}

function* shutdownVm (action) {
  yield startProgress({vmId: action.payload.vmId, name: 'shutdown'})
  const result = yield callExternalAction('shutdown', Api.shutdown, action)
  yield stopProgress({vmId: action.payload.vmId, name: 'shutdown', result})
}

function* restartVm (action) {
  yield startProgress({vmId: action.payload.vmId, name: 'restart'})
  const result = yield callExternalAction('restart', Api.restart, action)
  yield stopProgress({vmId: action.payload.vmId, name: 'restart', result})
}

function* suspendVm (action) {
  yield startProgress({vmId: action.payload.vmId, name: 'suspend'})
  const result = yield callExternalAction('suspend', Api.suspend, action)
  yield stopProgress({vmId: action.payload.vmId, name: 'suspend', result})
}

function* startVm (action) {
  yield startProgress({vmId: action.payload.vmId, name: 'start'})
  const result = yield callExternalAction('start', Api.start, action)
  yield stopProgress({vmId: action.payload.vmId, name: 'start', result})
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
    takeLatest('PERSIST_STATE', persistStateSaga),

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
