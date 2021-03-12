import { put, call, all } from 'redux-saga/effects'

import Api, { Transforms } from '_/ovirtapi'
import {
  getEngineOption,
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
import { DEFAULT_ARCH, DEFAULT_ENGINE_OPTION_VALUE } from '_/constants'

export function* fetchServerConfiguredValues () {
  const [
    maxNumOfSockets, maxNumOfCores, maxNumOfThreads, maxNumOfVmCpusPerArch,
    usbAutoShare, usbFilter,
    userSessionTimeout,
    defaultGeneralTimezone, defaultWindowsTimezone,
    websocketProxy,
    consoleDefault,
    defaultVncMode,
  ] = yield all([
    call(fetchEngineOption, 'MaxNumOfVmSockets', 16),
    call(fetchEngineOption, 'MaxNumOfCpuPerSocket', 254),
    call(fetchEngineOption, 'MaxNumOfThreadsPerCpu', 8),
    call(fetchEngineOption, 'MaxNumOfVmCpus', `{${DEFAULT_ARCH}=1}`),

    call(fetchGeneralEngineOption, 'SpiceUsbAutoShare', 1),
    callExternalAction('getUSBFilter', Api.getUSBFilter, {}),

    call(fetchGeneralEngineOption, 'UserSessionTimeOutInterval', 30),

    call(fetchGeneralEngineOption, 'DefaultGeneralTimeZone', 'Etc/GMT'),
    call(fetchGeneralEngineOption, 'DefaultWindowsTimeZone', 'GMT Standard Time'),

    call(fetchGeneralEngineOption, 'WebSocketProxy', ''),
    call(fetchGeneralEngineOption, 'ClientModeConsoleDefault', ''),
    call(fetchGeneralEngineOption, 'ClientModeVncDefault', ''),
  ])

  // Per version is "compatibility version" of the VM, or if not set in VM, the Cluster
  yield put(setCpuTopologyOptions({
    maxNumOfSockets: Transforms.EngineOptionNumberPerVersion.toInternal(maxNumOfSockets),
    maxNumOfCores: Transforms.EngineOptionNumberPerVersion.toInternal(maxNumOfCores),
    maxNumOfThreads: Transforms.EngineOptionNumberPerVersion.toInternal(maxNumOfThreads),
    maxNumOfVmCpusPerArch: Transforms.EngineOptionMaxNumOfVmCpus.toInternal(maxNumOfVmCpusPerArch),
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

export function* fetchEngineOption (name, defaultValue) {
  const option = yield callExternalAction(
    'getEngineOption',
    Api.getEngineOption,
    getEngineOption(name),
    true
  )

  let internalOption
  if (option && option.values) {
    internalOption = Transforms.EngineOption.toInternal(option)
  } else {
    internalOption = new Map()
  }

  if (defaultValue) {
    internalOption.set(DEFAULT_ENGINE_OPTION_VALUE, defaultValue)
  }
  return internalOption
}

export function* fetchGeneralEngineOption (name, defaultValue) {
  const option = yield fetchEngineOption(name)
  return option.has('general') ? option.get('general') : defaultValue
}
