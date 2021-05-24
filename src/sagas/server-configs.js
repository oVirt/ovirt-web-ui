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
import { DefaultEngineOptions } from '_/config'
import { DEFAULT_ENGINE_OPTION_VERSION } from '_/constants'

import { callExternalAction } from './utils'

export function* fetchServerConfiguredValues () {
  const eo = yield all({
    maxNumOfSockets: call(fetchEngineOption, 'MaxNumOfVmSockets', DefaultEngineOptions.MaxNumOfVmSockets),
    maxNumOfCores: call(fetchEngineOption, 'MaxNumOfCpuPerSocket', DefaultEngineOptions.MaxNumOfCpuPerSocket),
    maxNumOfThreads: call(fetchEngineOption, 'MaxNumOfThreadsPerCpu', DefaultEngineOptions.MaxNumOfThreadsPerCpu),
    maxNumOfVmCpusPerArch: call(fetchEngineOption, 'MaxNumOfVmCpus', DefaultEngineOptions.MaxNumOfVmCpusPerArch),

    usbAutoShare: call(fetchGeneralEngineOption, 'SpiceUsbAutoShare', DefaultEngineOptions.SpiceUsbAutoShare),
    usbFilter: callExternalAction('getUSBFilter', Api.getUSBFilter, DefaultEngineOptions.getUSBFilter),

    userSessionTimeout: call(fetchGeneralEngineOption, 'UserSessionTimeOutInterval', DefaultEngineOptions.UserSessionTimeOutInterval),

    defaultGeneralTimezone: call(fetchGeneralEngineOption, 'DefaultGeneralTimeZone', DefaultEngineOptions.DefaultGeneralTimeZone),
    defaultWindowsTimezone: call(fetchGeneralEngineOption, 'DefaultWindowsTimeZone', DefaultEngineOptions.DefaultWindowsTimeZone),

    websocketProxy: call(fetchGeneralEngineOption, 'WebSocketProxy', DefaultEngineOptions.WebSocketProxy),
    consoleDefault: call(fetchGeneralEngineOption, 'ClientModeConsoleDefault', DefaultEngineOptions.ClientModeConsoleDefault),
    defaultVncMode: call(fetchGeneralEngineOption, 'ClientModeVncDefault', DefaultEngineOptions.ClientModeVncDefault),
  })

  // Per version is "compatibility version" of the VM, or if not set in VM, the Cluster
  yield put(setCpuTopologyOptions({
    maxNumOfSockets: Transforms.EngineOptionNumberPerVersion.toInternal(eo.maxNumOfSockets),
    maxNumOfCores: Transforms.EngineOptionNumberPerVersion.toInternal(eo.maxNumOfCores),
    maxNumOfThreads: Transforms.EngineOptionNumberPerVersion.toInternal(eo.maxNumOfThreads),
    maxNumOfVmCpusPerArch: Transforms.EngineOptionMaxNumOfVmCpusPerArch.toInternal(eo.maxNumOfVmCpusPerArch),
  }))

  if (eo.usbAutoShare) {
    yield put(setSpiceUsbAutoShare(Transforms.convertBool(eo.usbAutoShare)))
  }

  if (eo.usbFilter) {
    yield put(setUSBFilter({ usbFilter: eo.usbFilter }))
  }

  yield put(setUserSessionTimeoutInternal(parseInt(eo.userSessionTimeout, 10)))

  yield put(setDefaultTimezone({
    defaultGeneralTimezone: eo.defaultGeneralTimezone,
    defaultWindowsTimezone: eo.defaultWindowsTimezone,
  }))

  if (eo.websocketProxy) {
    const [ host = '', port = '' ] = eo.websocketProxy.split(':')
    yield put(setWebsocket({ host, port }))
  }
  if (eo.consoleDefault) {
    yield put(setDefaultConsole(eo.consoleDefault))
  }
  if (eo.defaultVncMode) {
    yield put(setDefaultVncMode(eo.defaultVncMode))
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
    internalOption.set(DEFAULT_ENGINE_OPTION_VERSION, defaultValue)
  }
  return internalOption
}

export function* fetchGeneralEngineOption (name, defaultValue) {
  const option = yield fetchEngineOption(name)
  return option.has('general') ? option.get('general') : defaultValue
}
