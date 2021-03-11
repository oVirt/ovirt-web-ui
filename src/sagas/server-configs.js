import { put, call, all, select } from 'redux-saga/effects'

import Api from '_/ovirtapi'
import {
  getOption,
  setCpuTopologyOptions,
  setDefaultTimezone,
  setSpiceUsbAutoShare,
  setUSBFilter,
  setUserSessionTimeoutInternal,
  setWebsocket,
  setDefaultConsole,
  setDefaultVncMode,
} from '_/actions'

import { callExternalAction } from './utils'
import { isNumber } from '_/utils'

export function* fetchServerConfiguredValues () {
  const optionVersion = yield select(state => {
    const ver = state.config.get('oVirtApiVersion')
    return `${ver.get('major')}.${ver.get('minor')}`
  })

  const [
    maxNumberOfSockets, maxNumberOfCores, maxNumberOfThreads, maxNumOfVmCpus,
    usbAutoShare, usbFilter,
    userSessionTimeout,
    defaultGeneralTimezone, defaultWindowsTimezone,
    websocketProxy,
    consoleDefault,
    defaultVncMode,
  ] = yield all([
    callGetOption('MaxNumOfVmSockets', optionVersion, 16),
    callGetOption('MaxNumOfCpuPerSocket', optionVersion, 16),
    callGetOption('MaxNumOfThreadsPerCpu', optionVersion, 16),
    callGetOption('MaxNumOfVmCpus', optionVersion, 1),

    callGetOption('SpiceUsbAutoShare', 'general', 1),
    callExternalAction('getUSBFilter', Api.getUSBFilter, {}),

    callGetOption('UserSessionTimeOutInterval', 'general', 30),

    callGetOption('DefaultGeneralTimeZone', 'general', 'Etc/GMT'),
    callGetOption('DefaultWindowsTimeZone', 'general', 'GMT Standard Time'),

    callGetOption('WebSocketProxy', 'general', ''),
    callGetOption('ClientModeConsoleDefault', 'general', ''),
    callGetOption('ClientModeVncDefault', 'general', ''),
  ])

  yield put(setCpuTopologyOptions({
    maxNumberOfSockets: parseInt(maxNumberOfSockets, 10),
    maxNumberOfCores: parseInt(maxNumberOfCores, 10),
    maxNumberOfThreads: parseInt(maxNumberOfThreads, 10),
    // TODO: need to replace this by the actual map value parsing for maxNumOfVmCpus
    maxNumOfVmCpus: isNumber(parseInt(maxNumOfVmCpus, 10)) ? parseInt(maxNumOfVmCpus, 10) : 512,
  }))

  if (usbAutoShare) {
    yield put(setSpiceUsbAutoShare(usbAutoShare))
  }

  if (usbFilter) {
    yield put(setUSBFilter({ usbFilter }))
  }

  yield put(setUserSessionTimeoutInternal(parseInt(userSessionTimeout, 10)))

  yield put(setDefaultTimezone({
    defaultGeneralTimezone,
    defaultWindowsTimezone,
  }))

  if (websocketProxy) {
    const [ host = '', port = '' ] = websocketProxy.split(':')
    yield put(setWebsocket({ host, port }))
  }
  if (consoleDefault) {
    yield put(setDefaultConsole(consoleDefault))
  }
  if (defaultVncMode) {
    yield put(setDefaultVncMode(defaultVncMode))
  }
}

function callGetOption (name, version, defaultValue) {
  return call(
    callExternalAction,
    'getOption',
    Api.getOption,
    getOption(name, version, defaultValue)
  )
}
