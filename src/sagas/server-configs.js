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
} from '_/actions'

import { callExternalAction } from './utils'

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
  ] = yield all([
    callGetOption('MaxNumOfVmSockets', optionVersion, 16),
    callGetOption('MaxNumOfCpuPerSocket', optionVersion, 16),
    callGetOption('MaxNumOfThreadsPerCpu', optionVersion, 16),
    callGetOption('MaxNumOfVmCpus', optionVersion, 1),

    callExternalAction('getSpiceUsbAutoShare', Api.getSpiceUsbAutoShare, {}),
    callExternalAction('getUSBFilter', Api.getUSBFilter, {}),

    callGetOption('UserSessionTimeOutInterval', 'general', 30),

    callGetOption('DefaultGeneralTimeZone', 'general', 'Etc/GMT'),
    callGetOption('DefaultWindowsTimeZone', 'general', 'GMT Standard Time'),

    callGetOption('WebSocketProxy', 'general', ''),
  ])

  yield put(setCpuTopologyOptions({
    maxNumberOfSockets: parseInt(maxNumberOfSockets, 10),
    maxNumberOfCores: parseInt(maxNumberOfCores, 10),
    maxNumberOfThreads: parseInt(maxNumberOfThreads, 10),
    maxNumOfVmCpus: parseInt(maxNumOfVmCpus, 10),
  }))

  if (usbAutoShare) {
    const autoShareValue = usbAutoShare.values.system_option_value[0].value === 'true'
    yield put(setSpiceUsbAutoShare(autoShareValue))
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
}

function callGetOption (name, version, defaultValue) {
  return call(
    callExternalAction,
    'getOption',
    Api.getOption,
    getOption(name, version, defaultValue)
  )
}
