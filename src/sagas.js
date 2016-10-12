import { call, put } from 'redux-saga/effects'

import {logDebug, hidePassword, fileDownload} from 'ovirt-ui-components'
import {getAllVms, loginSuccessful, loginFailed, failedExternalAction, loadInProgress} from 'ovirt-ui-components'

import {getVmIcons, getVmDisks, updateVmIcon, updateVmDisk, updateVm} from './actions'

import Api from './ovirtapi'

export function * foreach (array, fn, context) {
  var i = 0
  var length = array.length

  for (;i < length; i++) {
    yield * fn.call(context, array[i], i, array)
  }
}

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
export function* login (action) {
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

export function* fetchAllVms (action) {
  const allVms = yield callExternalAction('getAllVms', Api.getAllVms, action)

  if (allVms && allVms['vm']) { // array
    // TODO: call removeMissgingVMs (those not present in the allVms['vms']) if refresh
    yield* foreach(allVms.vm, function* (vm) {
      const internalVm = Api.vmToInternal({vm})
      yield put(updateVm({vm: internalVm}))

      yield put(getVmIcons({vmId: internalVm.id, smallIconId: internalVm.icons.small.id, largeIconId: internalVm.icons.large.id}))
      yield put(getVmDisks({vmId: internalVm.id}))
    })
  }
  yield put(loadInProgress({value: false}))
}

export function* fetchVmIcons(action) {
  const {vmId, smallIconId, largeIconId} = action.payload

  if (largeIconId) {
    const icon = yield callExternalAction('icon', Api.icon, {payload: {id: largeIconId}})
    if (icon['media_type'] && icon['data']) {
      yield put(updateVmIcon({vmId, icon, type: 'large'}))
    }
  }

  if (smallIconId) {
    const icon = yield callExternalAction('icon', Api.icon, {payload: {id: smallIconId}})
    if (icon['media_type'] && icon['data']) {
      yield put(updateVmIcon({vmId, icon, type: 'small'}))
    }
  }
}

export function* fetchVmDisks(action) {
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

export function* shutdownVm (action) {
  yield callExternalAction('shutdown', Api.shutdown, action)
}

export function* restartVm (action) {
  yield callExternalAction('restart', Api.restart, action)
}

export function* startVm (action) {
  yield callExternalAction('start', Api.start, action)
}

export function* getConsoleVm (action) {
  const consoles = yield callExternalAction('consoles', Api.consoles, action)

  if (consoles && consoles['graphics_console'] && consoles['graphics_console'].length > 0) {
    let console = consoles['graphics_console'].find( c => 'spice' === c.protocol) || consoles['graphics_console'][0]
    const data = yield callExternalAction('console', Api.console, {action: 'INTERNAL_CONSOLE', payload: {vmId: action.payload.vmId, consoleId: console.id}})
    fileDownload({data, fileName: 'console.vv', mimeType: 'application/x-virt-viewer'})
  }
}

export function* suspendVm (action) {
  yield callExternalAction('suspend', Api.suspend, action)
}