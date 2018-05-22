import {
  call,
  put,
} from 'redux-saga/effects'

import {
  logDebug,
  hidePassword,
} from '../helpers'

import { msg } from '../intl/index'

import {
  failedExternalAction,
  checkTokenExpired,
} from '../actions/index'

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export function * callExternalAction (methodName, method, action, canBeMissing = false) {
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

export function * waitTillEqual (leftArg, rightArg, limit) {
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
  'GET_DISK_ATTACHMENTS': msg.failedToRetrieveVmDisks(),
  'GET_ISO_STORAGES': msg.failedToRetrieveIsoStorages(),
  'GET_ALL_FILES_FOR_ISO': msg.failedToRetrieveFilesFromStorage(),

  'GET_VM': msg.failedToRetrieveVmDetails(),
  'CHANGE_VM_ICON': msg.failedToChangeVmIcon(),
  'CHANGE_VM_ICON_BY_ID': msg.failedToChangeVmIconToDefault(),
}

export function shortErrorMessage ({ action }) {
  return shortMessages[action.type] ? shortMessages[action.type] : msg.actionFailed({ action: action.type })
}

export function * foreach (array, fn, context) {
  var i = 0
  var length = array.length

  for (;i < length; i++) {
    yield * fn.call(context, array[i], i, array)
  }
}
