import Product from '../version'
import Api from '../ovirtapi'
import AppConfiguration from '../config'
import OptionsManager from '../optionsManager'
import Selectors from '../selectors'

import {
  call,
  put,
} from 'redux-saga/effects'

import {
  loginSuccessful,
  loginFailed,

  loadInProgress,
  failedExternalAction,
  showTokenExpiredMessage,
  setOvirtApiVersion,

  setUserFilterPermission,
  setAdministrator,

  getByPage,
  getAllTemplates,
  getAllClusters,
  getAllHosts,
  getAllOperatingSystems,

  downloadConsole,
  getUSBFilter,
  getVm,

  updateVms,
} from '../actions/index'

import {
  callExternalAction,
  waitTillEqual,
  compareVersion,
} from './utils'

import {
  downloadVmConsole,
} from './consoles'

export function* login (action) {
  yield put(loadInProgress({ value: true }))

  let token = action.payload.token // the user is already logged in via oVirt SSO
  let result = {}

  if (token) {
    const username = action.payload.credentials.username
    yield put(loginSuccessful({
      token,
      username,
      userId: action.payload.userId,
    }))

    const oVirtMeta = yield callExternalAction('getOvirtApiMeta', Api.getOvirtApiMeta, action)
    if (!oVirtMeta['product_info']) { // REST API call failed
      yield put(yield put(loadInProgress({ value: false })))
    } else {
      if (yield checkOvirtApiVersion(oVirtMeta)) {
        yield put(getUSBFilter())
        yield fetchPermissionWithoutFilter({}) // progress loader disabled in here
        yield autoConnectCheck({})
      } else { // oVirt API of incompatible version
        console.error('oVirt api version check failed')
        yield put(failedExternalAction({
          message: composeIncompatibleOVirtApiVersionMessage(oVirtMeta),
          shortMessage: 'oVirt API version check failed',
        }))
        yield put(yield put(loadInProgress({ value: false })))
      }
    }
  } else {
    yield put(loginFailed({
      errorCode: result['error_code'] ? result['error_code'] : 'no_access',
      message: result['error'] ? (result.error['statusText'] ? result.error['statusText'] : JSON.stringify(result['error'])) : 'Login Failed',
    }))
    yield put(yield put(loadInProgress({ value: false })))
  }
}

export function* doCheckTokenExpired (action) {
  try {
    yield call(Api.getOvirtApiMeta, action.payload)
    console.info('doCheckTokenExpired(): token is still valid') // info level: to pair former HTTP 401 error message with updated information
    return
  } catch (error) {
    if (error.status === 401) {
      console.info('Token expired, going to reload the page')
      yield put(showTokenExpiredMessage())

      // Reload the page after a delay
      // No matter saga is canceled for whatever reason, the reload must happen, so here comes the ugly setTimeout()
      setTimeout(() => {
        console.info('======= doCheckTokenExpired() issuing page reload')
        window.location.href = AppConfiguration.applicationURL
      }, 5 * 1000)
      return
    }
    console.error('doCheckTokenExpired(): unexpected oVirt API error: ', error)
  }
}

function composeIncompatibleOVirtApiVersionMessage (oVirtMeta) {
  const requested = `${Product.ovirtApiVersionRequired.major}.${Product.ovirtApiVersionRequired.minor}`
  let found
  if (!(oVirtMeta && oVirtMeta['product_info'] && oVirtMeta['product_info']['version'] &&
      oVirtMeta['product_info']['version']['major'] && oVirtMeta['product_info']['version']['minor'])) {
    found = JSON.stringify(oVirtMeta)
  } else {
    const version = oVirtMeta['product_info']['version']
    found = `${version.major}.${version.minor}`
  }
  return `oVirt API version requested >= ${requested}, but ${found} found`
}

function* checkOvirtApiVersion (oVirtMeta) {
  if (!(oVirtMeta && oVirtMeta['product_info'] && oVirtMeta['product_info']['version'] &&
      oVirtMeta['product_info']['version']['major'] && oVirtMeta['product_info']['version']['minor'])) {
    console.error('Incompatible oVirt API version: ', oVirtMeta)
    yield put(setOvirtApiVersion({
      passed: false,
      ...oVirtMeta,
    }))
    return false
  }

  const actual = oVirtMeta['product_info']['version']

  const required = Product.ovirtApiVersionRequired
  const passed = compareVersion({
    major: parseInt(actual.major),
    minor: parseInt(actual.minor),
  }, required)

  yield put(setOvirtApiVersion({
    passed,
    ...actual,
  }))

  return passed
}

export function* logout () {
  window.location.href = `${AppConfiguration.applicationURL}/sso/logout`
}

function* autoConnectCheck (action) {
  const vmId = OptionsManager.loadAutoConnectOption()
  if (vmId && vmId.length > 0) {
    const vm = yield callExternalAction('getVm', Api.getVm, getVm({ vmId }), true)
    if (vm && vm.error && vm.error.status === 404) {
      OptionsManager.clearAutoConnect()
    } else if (vm && vm.id && vm.status !== 'down') {
      const internalVm = Api.vmToInternal({ vm })
      yield put(updateVms({ vms: [internalVm] }))

      yield downloadVmConsole(downloadConsole({ vmId }))
    }
  }
}

function* initialLoad () {
  yield put(getAllClusters()) // no shallow
  yield put(getAllHosts())
  yield put(getAllOperatingSystems())
  yield put(getAllTemplates({ shallowFetch: false }))

  yield put(getByPage({ page: 1 })) // first page of VMs list
}

function* fetchPermissionWithoutFilter (action) {
  const data = yield callExternalAction('checkFilter', Api.checkFilter, { action: 'CHECK_FILTER' }, true)

  // this must be processed before continuing with next steps
  const isFiltered = data.error !== undefined
  yield put(setUserFilterPermission(isFiltered))
  yield waitTillEqual(Selectors.getFilter, isFiltered, 50)

  yield put(setUserFilterPermission(data.error !== undefined))

  yield initialLoad()

  yield put(setAdministrator(data.error === undefined))
}
