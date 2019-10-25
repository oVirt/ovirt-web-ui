import { put, call, all, select } from 'redux-saga/effects'

import Api from '_/ovirtapi'
import {
  getOption,
  setCpuTopologyOptions,
  setDefaultTimezone,
  setUSBFilter,
  setUserSessionTimeoutInternal,
  setWebsocket,
} from '_/actions'

import { callExternalAction } from './utils'

export function* fetchServerConfiguredValues () {
  yield all([
    call(fetchCpuTopologyOptions),
    call(fetchUSBFilter),
    call(fetchUserSessionTimeoutInterval),
    call(fetchWebsocketProxy),
    call(fetchDefaultTimeZoneConfig),
  ])
}

function callGetOption (name, version, defaultValue) {
  return call(
    callExternalAction,
    'getOption',
    Api.getOption,
    getOption(name, version, defaultValue)
  )
}

function* fetchCpuTopologyOptions () {
  const optionVersion = yield select(state => {
    const ver = state.config.get('oVirtApiVersion')
    return `${ver.get('major')}.${ver.get('minor')}`
  })

  const [ maxNumberOfSockets, maxNumberOfCores, maxNumberOfThreads, maxNumOfVmCpus ] =
    yield all([
      callGetOption('MaxNumOfVmSockets', optionVersion, 16),
      callGetOption('MaxNumOfCpuPerSocket', optionVersion, 16),
      callGetOption('MaxNumOfThreadsPerCpu', optionVersion, 16),
      callGetOption('MaxNumOfVmCpus', optionVersion, 1),
    ])

  yield put(setCpuTopologyOptions({
    maxNumberOfSockets: parseInt(maxNumberOfSockets, 10),
    maxNumberOfCores: parseInt(maxNumberOfCores, 10),
    maxNumberOfThreads: parseInt(maxNumberOfThreads, 10),
    maxNumOfVmCpus: parseInt(maxNumOfVmCpus, 10),
  }))
}

function* fetchUSBFilter () {
  const usbFilter = yield callExternalAction('getUSBFilter', Api.getUSBFilter, {})
  if (usbFilter) {
    yield put(setUSBFilter({ usbFilter }))
  }
}

function* fetchUserSessionTimeoutInterval () {
  const userSessionTimeout = yield callGetOption('UserSessionTimeOutInterval', 'general', 30)
  yield put(setUserSessionTimeoutInternal(parseInt(userSessionTimeout, 10)))
}

function* fetchDefaultTimeZoneConfig () {
  const [ defaultGeneralTimezone, defaultWindowsTimezone ] =
  yield all([
    yield callGetOption('DefaultGeneralTimeZone', 'general', 'Etc/GMT'),
    yield callGetOption('DefaultWindowsTimeZone', 'general', 'GMT Standard Time'),
  ])
  yield put(setDefaultTimezone({
    defaultGeneralTimezone,
    defaultWindowsTimezone,
  }))
}

function* fetchWebsocketProxy () {
  const data = yield callGetOption('WebSocketProxy', 'general', '')
  if (data) {
    const [ host = '', port = '' ] = data.split(':')
    yield put(setWebsocket({ host, port }))
  }
}
