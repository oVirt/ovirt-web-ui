import { takeEvery, takeLatest } from 'redux-saga'
import { call, put } from 'redux-saga/effects'
import {foreach, logDebug, hidePassword, ovirtVmToInternal} from './helpers'
import Api from './api'

import {getAllVms, updateVm, loginSuccessful, loginFailed, failedExternalAction} from './actions'

// TODO: Review error handling!! Exceptions + HTTP non-200 codes

function* login (action) {
  try {
    logDebug(`saga: login() starts on ${JSON.stringify(hidePassword({action}))}`)
    const token = yield call(Api.login, action.payload.credentials)

    if (token['access_token']) {
      yield put(loginSuccessful({token}))
      yield put(getAllVms())
    } else {
      yield put(loginFailed())
    }

  } catch (e) {
    yield put(loginFailed())
    yield put(failedExternalAction({message: e.message, action: hidePassword(action)}))
  }
}
/* TODO:
function* logout (action) {
  try {
    logDebug(`saga: logout() starts on ${JSON.stringify(action)}`)
    logDebug(`TODO!`)
  } catch (e) {
    yield put(failedExternalAction({message: e.message, action}))
  }
}
*/
function* fetchAllVms (action) {
  try {
    logDebug(`saga: fetchAllVms() starts`)
    const allVms = yield call(Api.getAllVms)

    logDebug(`fetchAllVms() data: ${JSON.stringify(allVms)}`)

    if (allVms['vm']) { // array
      yield* foreach(allVms.vm, function* (vm) {
        yield put(updateVm({vm: ovirtVmToInternal({vm})}))
      })
    }
  } catch (e) {
    yield put(failedExternalAction({message: e, action}))
  }
}

function* shutdownVm (action) {
  try {
    logDebug(`saga: shutdownVm() starts on ${JSON.stringify(action)}`)
    logDebug(`TODO!`)
  } catch (e) {
    yield put(failedExternalAction({message: e.message, action}))
  }
}

function* restartVm (action) {
  try {
    logDebug(`saga: restartVm() starts on ${JSON.stringify(action)}`)
    logDebug(`TODO!`)
  } catch (e) {
    yield put(failedExternalAction({message: e.message, action}))
  }
}

function* startVm (action) {
  try {
    logDebug(`saga: startVm() starts on ${JSON.stringify(action)}`)
    logDebug(`TODO!`)
  } catch (e) {
    yield put(failedExternalAction({message: e.message, action}))
  }
}

function* getConsoleVm (action) {
  try {
    logDebug(`saga: getConsoleVm() starts on ${JSON.stringify(action)}`)
    logDebug(`TODO!`)
  } catch (e) {
    yield put(failedExternalAction({message: e.message, action}))
  }
}

function* mySaga () {
  yield [
    takeEvery("LOGIN", login),
    takeLatest("GET_ALL_VMS", fetchAllVms),
    takeEvery("SHUTDOWN_VM", shutdownVm),
    takeEvery("RESTART_VM", restartVm),
    takeEvery("START_VM", startVm),
    takeEvery("GET_CONSOLE_VM", getConsoleVm)
  ]
}

export default mySaga