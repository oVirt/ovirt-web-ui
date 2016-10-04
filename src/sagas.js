import { takeEvery, takeLatest } from 'redux-saga'
import { call, put } from 'redux-saga/effects'
import {foreach, logDebug, hidePassword} from './helpers'
import Api from './api'

import {getAllVms, getVmIcons, updateVmIcon, updateVm, loginSuccessful, loginFailed, failedExternalAction, loadInProgress} from './actions'

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
    logDebug(`login(): received data: ${JSON.stringify(token)}`)

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
    yield* foreach(allVms.vm, function* (vm) {
      const internalVm = Api.vmToInternal({vm})
      yield put(updateVm({vm: internalVm}))
      yield put(getVmIcons({vm: internalVm}))
    })
  }
  yield put(yield put(loadInProgress({value: false})))
}

function* fetchVmIcons(action) {
  const {vm} = action.payload

  if (vm.icons.large.id) {
    const icon = yield callExternalAction('icon', Api.icon, {payload: {id: vm.icons.large.id}})
    if (icon['media_type'] && icon['data']) {
      yield put(updateVmIcon({vmId: vm.id, icon, type: 'large'}))
    }
  }

  if (vm.icons.small.id) {
    const icon = yield callExternalAction('icon', Api.icon, {payload: {id: vm.icons.small.id}})
    if (icon['media_type'] && icon['data']) {
      yield put(updateVmIcon({vmId: vm.id, icon, type: 'small'}))
    }
  }
}

function* shutdownVm (action) {
  yield callExternalAction('shutdown', Api.shutdown, action)
}

function* restartVm (action) {
  yield callExternalAction('restart', Api.restart, action)
}

function* startVm (action) {
  yield callExternalAction('start', Api.start, action)
}

function* getConsoleVm (action) {
  yield callExternalAction('getConsoleToBeDefined', Api.console, action)
}

function* mySaga () {
  yield [
    takeEvery("LOGIN", login),
    takeLatest("GET_ALL_VMS", fetchAllVms),
    takeEvery("GET_VM_ICONS", fetchVmIcons),
    takeEvery("SHUTDOWN_VM", shutdownVm),
    takeEvery("RESTART_VM", restartVm),
    takeEvery("START_VM", startVm),
    takeEvery("GET_CONSOLE_VM", getConsoleVm)
  ]
}

export default mySaga
