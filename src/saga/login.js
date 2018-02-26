import Product from '../version'
import Api from '../ovirtapi'
import AppConfiguration from '../config'
import OptionsManager from '../optionsManager'
import Selectors from '../selectors'

import { logDebug } from '../helpers'

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
  getOption,

  getByPage,
  getAllTemplates,
  getAllClusters,
  getAllHosts,
  getAllOperatingSystems,
  getAllNetworks,
  getAllVnicProfiles,

  downloadConsole,
  getUSBFilter,
  getSingleVm,

  updateVms,
} from '../actions/index'

import {
  callExternalAction,
  waitTillEqual,
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
        yield fetchPermissionWithoutFilter({})
        yield initialLoad() // progress loader disabled in here
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

export function compareVersion (actual, required) {
  logDebug(`compareVersion(), actual=${JSON.stringify(actual)}, required=${JSON.stringify(required)}`)

  // assuming backward compatibility of oVirt API
  if (actual.major >= required.major) {
    if (actual.major === required.major) {
      if (actual.minor < required.minor) {
        return false
      }
    }
    return true
  }
  return false
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
    const vm = yield callExternalAction('getVm', Api.getVm, getSingleVm({ vmId }), true)
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
  yield put(getAllNetworks())
  yield put(getAllVnicProfiles())

  yield put(getByPage({ page: 1 })) // first page of VMs list
}

function* fetchPermissionWithoutFilter (action) {
  const data = yield callExternalAction('checkFilter', Api.checkFilter, { action: 'CHECK_FILTER' }, true)

  const isAdmin = data.error === undefined
  yield put(setAdministrator(isAdmin))

  if (!isAdmin) {
    yield put(setUserFilterPermission(true))
    return
  }

  const alwaysFilterOption = yield callExternalAction(
    'getOption',
    Api.getOption,
    getOption('AlwaysFilterResultsForWebUi', 'general', 'false'))

  const isAlwaysFilterOption = alwaysFilterOption === 'true'
  yield put(setUserFilterPermission(isAlwaysFilterOption))
  yield waitTillEqual(Selectors.getFilter, isAlwaysFilterOption, 50)
}
