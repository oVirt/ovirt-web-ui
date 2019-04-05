import Product from '../version'
import Api from '_/ovirtapi'
import AppConfiguration from '../config'
import OptionsManager from '../optionsManager'
import Selectors from '../selectors'

import logger from '../logger'

import {
  call,
  put,
} from 'redux-saga/effects'

import {
  loginSuccessful,
  loginFailed,
  startSchedulerFixedDelay,

  failedExternalAction,
  showTokenExpiredMessage,
  setOvirtApiVersion,

  setUserFilterPermission,
  setAdministrator,
  setCpuTopologyOptions,
  getOption,

  getAllClusters,
  getAllHosts,
  getAllOperatingSystems,
  getAllStorageDomains,
  getAllTemplates,
  getAllVnicProfiles,
  getByPage,
  getIsoFiles,
  getUserGroups,

  downloadConsole,
  getUSBFilter,
  getSingleVm,

  updateVms,
} from '_/actions'

import {
  callExternalAction,
  waitTillEqual,
} from './utils'

import {
  downloadVmConsole,
} from './console'

/**
 * Perform login checks, and if they pass, perform initial data loading
 */
export function* login (action) {
  const { payload: { token, userId, credentials: { username } } } = action

  // Verify a SSO token exists
  if (!token) {
    yield put(loginFailed({
      errorCode: 'no_access',
      message: 'Login Failed', // TODO: Localize
    }))
    return
  }

  yield put(loginSuccessful({ token, username, userId }))

  // Verify the API (exists and is the correct version)
  const oVirtMeta = yield callExternalAction('getOvirtApiMeta', Api.getOvirtApiMeta, action)
  const versionOk = yield checkOvirtApiVersion(oVirtMeta)
  if (!versionOk) {
    logger.error('oVirt API version check failed')
    yield put(failedExternalAction({
      message: composeIncompatibleOVirtApiVersionMessage(oVirtMeta),
      shortMessage: 'oVirt API version check failed', // TODO: Localize
    }))
    return
  }

  // API checks passed.  Load user data and the initial app data
  yield fetchPermissionWithoutFilter()
  yield fetchCpuTopologyOptions()
  yield put(getUSBFilter())
  yield initialLoad()
  yield autoConnectCheck()
  yield put(startSchedulerFixedDelay())
}

export function* doCheckTokenExpired (action) {
  try {
    yield call(Api.getOvirtApiMeta, action.payload)
    logger.info('doCheckTokenExpired(): token is still valid') // info level: to pair former HTTP 401 error message with updated information
    return
  } catch (error) {
    if (error.status === 401) {
      logger.info('Token expired, going to reload the page')
      yield put(showTokenExpiredMessage())

      // Reload the page after a delay
      // No matter saga is canceled for whatever reason, the reload must happen, so here comes the ugly setTimeout()
      setTimeout(() => {
        logger.info('======= doCheckTokenExpired() issuing page reload')
        window.location.href = AppConfiguration.applicationURL
      }, 5 * 1000)
      return
    }
    logger.error('doCheckTokenExpired(): unexpected oVirt API error: ', error)
  }
}

function composeIncompatibleOVirtApiVersionMessage (oVirtMeta) {
  const requested = `${Product.ovirtApiVersionRequired.major}.${Product.ovirtApiVersionRequired.minor}`
  let found
  if (!(oVirtMeta &&
        oVirtMeta['product_info'] &&
        oVirtMeta['product_info']['version'] &&
        oVirtMeta['product_info']['version']['major'] &&
        oVirtMeta['product_info']['version']['minor'])) {
    found = JSON.stringify(oVirtMeta)
  } else {
    const version = oVirtMeta['product_info']['version']
    found = `${version.major}.${version.minor}`
  }
  return `oVirt API version requested >= ${requested}, but ${found} found` // TODO: Localize
}

/**
 * Compare the actual { major, minor } version to the required { major, minor } and
 * return if the **actual** is greater then or equal to **required**.
 *
 * Backward compatibility of the API is assumed.
 */
export function compareVersion (actual, required) {
  logger.log(`compareVersion(), actual=${JSON.stringify(actual)}, required=${JSON.stringify(required)}`)

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

/**
 * Verify the API meta-data has version information available and that the version
 * is compatible with our expected API version.
 */
function* checkOvirtApiVersion (oVirtMeta) {
  if (!(oVirtMeta &&
        oVirtMeta['product_info'] &&
        oVirtMeta['product_info']['version'] &&
        oVirtMeta['product_info']['version']['major'] &&
        oVirtMeta['product_info']['version']['minor'])) {
    logger.error('Incompatible oVirt API version: ', oVirtMeta)
    yield put(setOvirtApiVersion({ passed: false, ...oVirtMeta }))
    return false
  }

  const actual = oVirtMeta['product_info']['version']
  const required = Product.ovirtApiVersionRequired
  const passed = compareVersion(actual, required)

  yield put(setOvirtApiVersion({ passed, ...actual }))
  return passed
}

export function* logout () {
  window.location.href = `${AppConfiguration.applicationURL}/sso/logout`
}

function* autoConnectCheck () {
  const vmId = OptionsManager.loadAutoConnectOption()
  if (vmId && vmId.length > 0) {
    const vm = yield callExternalAction('getVm', Api.getVm, getSingleVm({ vmId }), true)
    if (vm && vm.error && vm.error.status === 404) {
      OptionsManager.clearAutoConnect()
    } else if (vm && vm.id && vm.status !== 'down') {
      const internalVm = Api.vmToInternal({ vm })
      yield put(updateVms({ vms: [internalVm] }))
      yield downloadVmConsole(downloadConsole({ vmId, hasGuestAgent: internalVm.ssoGuestAgent }))
    }
  }
}

function* fetchCpuTopologyOptions () {
  const version = Selectors.getOvirtVersion()
  const maxNumberOfSockets = yield callExternalAction(
    'getOption',
    Api.getOption,
    getOption('MaxNumOfVmSockets', `${version.get('major')}.${version.get('minor')}`, 16))
  const maxNumberOfCores = yield callExternalAction(
    'getOption',
    Api.getOption,
    getOption('MaxNumOfCpuPerSocket', `${version.get('major')}.${version.get('minor')}`, 16))
  const maxNumberOfThreads = yield callExternalAction(
    'getOption',
    Api.getOption,
    getOption('MaxNumOfThreadsPerCpu', `${version.get('major')}.${version.get('minor')}`, 16))
  const maxNumOfVmCpus = yield callExternalAction(
    'getOption',
    Api.getOption,
    getOption('MaxNumOfVmCpus', `${version.get('major')}.${version.get('minor')}`, 1))
  yield put(setCpuTopologyOptions({
    maxNumberOfSockets: parseInt(maxNumberOfSockets),
    maxNumberOfCores: parseInt(maxNumberOfCores),
    maxNumberOfThreads: parseInt(maxNumberOfThreads),
    maxNumOfVmCpus: parseInt(maxNumOfVmCpus),
  }))
}

function* initialLoad () {
  yield put(getUserGroups())

  // no requirements
  yield put(getAllOperatingSystems())
  yield put(getAllTemplates({ shallowFetch: false }))
  yield put(getAllHosts())
  yield put(getAllStorageDomains())

  // requires user groups to be in redux store for authorization checks
  yield put(getAllClusters())
  yield put(getAllVnicProfiles())

  // requires storage domains to be in redux store
  yield put(getIsoFiles())

  // --- store is populated with user & system info, now pull VMs and Pools
  yield put(getByPage({ page: 1 }))
}

function* fetchPermissionWithoutFilter () {
  const data = yield callExternalAction('checkFilter', Api.checkFilter, { action: 'CHECK_FILTER' }, true)

  const isAdmin = data.error === undefined // expect an error on `checkFilter` if the user isn't admin
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
