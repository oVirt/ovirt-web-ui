import { all, call, put, takeEvery, select } from 'redux-saga/effects'
import pick from 'lodash/pick'

import Product from '_/version'
import Api from '_/ovirtapi'
import AppConfiguration from '_/config'
import OptionsManager from '_/optionsManager'

import {
  loginSuccessful,
  loginFailed,
  startSchedulerFixedDelay,

  failedExternalAction,
  setOvirtApiVersion,

  setUserFilterPermission,
  setAdministrator,
  getAllEvents,
  getOption,

  getAllClusters,
  getAllHosts,
  getAllOperatingSystems,
  getAllStorageDomains,
  getAllTemplates,
  getAllVnicProfiles,
  getIsoFiles,
  getUserGroups,

  downloadConsole,
  getSingleVm,

  updateVms,
  appConfigured,
  saveVmsFilters,
} from '_/actions'

import { LOGIN, LOGOUT } from '_/constants'

import {
  callExternalAction,
  compareVersion,
} from './utils'

import {
  fetchAllClusters,
  fetchAllHosts,
  fetchAllOS,
  fetchAllTemplates,
  fetchAllVnicProfiles,
  fetchUserGroups,
} from './index'
import { downloadVmConsole } from './console'
import { fetchServerConfiguredValues } from './server-configs'
import { fetchDataCentersAndStorageDomains, fetchIsoFiles } from './storageDomains'

import { loadFromLocalStorage } from '_/storage'

/**
 * Perform login checks, and if they pass, perform initial data loading
 */
function* login (action) {
  const { payload: { token, userId, username, domain } } = action
  console.group('Login Verification')

  // Verify a SSO token exists
  if (!token) {
    yield put(loginFailed({
      errorCode: 'no_access',
      message: 'Login Failed', // TODO: Localize
    }))
    return
  }

  yield put(loginSuccessful({ token, userId, username, domain }))

  // Verify the API (exists and is the correct version)
  const oVirtMeta = yield callExternalAction('getOvirtApiMeta', Api.getOvirtApiMeta, action)
  const versionOk = yield checkOvirtApiVersion(oVirtMeta)
  if (!versionOk) {
    console.error('oVirt API version check failed')
    yield put(failedExternalAction({
      message: composeIncompatibleOVirtApiVersionMessage(oVirtMeta),
      shortMessage: 'oVirt API version check failed', // TODO: Localize
    }))
    return
  }
  console.groupEnd('Login Verification')

  // API checks passed.  Load user data and the initial app data
  console.group('Login Data Fetch')
  yield checkUserFilterPermissions()
  yield fetchServerConfiguredValues()
  console.log('\u2714 login checks and server config fetches are done:',
    yield select(state => pick(
      state.config.toJS(),
      [ 'administrator', 'filter', 'domain', 'user', 'userSessionTimeoutInterval', 'websocket', 'cpuTopology' ]))
  )

  yield initialLoad()
  console.groupEnd('Login Data Fetch')

  yield put(appConfigured())
  yield put(startSchedulerFixedDelay())
  yield autoConnectCheck()
  yield put(getAllEvents())
}

/**
 * Second action on logout: if configured, push the user to a SSO logout URL that
 * will manually invalidate the SSO token.
 *
 * NOTE: The __config__ reducer also responds to the logout action
 */
function* logout () {
  if (AppConfiguration.applicationLogoutURL && AppConfiguration.applicationLogoutURL.length > 0) {
    window.location.href = AppConfiguration.applicationLogoutURL
  }
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
    console.error('Incompatible oVirt API version: ', oVirtMeta)
    yield put(setOvirtApiVersion({ passed: false, ...oVirtMeta }))
    return false
  }

  const actual = oVirtMeta['product_info']['version']
  const required = Product.ovirtApiVersionRequired
  const passed = compareVersion(actual, required)

  yield put(setOvirtApiVersion({ passed, ...actual }))
  return passed
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

function* checkUserFilterPermissions () {
  const data = yield callExternalAction('checkFilter', Api.checkFilter, { action: 'CHECK_FILTER' }, true)

  const isAdmin = data.error === undefined // expect an error on `checkFilter` if the user isn't admin
  yield put(setAdministrator(isAdmin))

  if (!isAdmin) {
    yield put.resolve(setUserFilterPermission(true))
    return
  }

  const alwaysFilterOption = yield callExternalAction(
    'getOption',
    Api.getOption,
    getOption('AlwaysFilterResultsForWebUi', 'general', 'false'))

  const isAlwaysFilterOption = alwaysFilterOption === 'true'
  yield put.resolve(setUserFilterPermission(isAlwaysFilterOption))
}

function* loadFilters () {
  const userId = yield select(state => state.config.getIn(['user', 'id']))
  const filters = JSON.parse(loadFromLocalStorage(`vmFilters-${userId}`)) || {}
  yield put(saveVmsFilters({ filters }))
}

function* initialLoad () {
  // no data prerequisites
  yield all([
    call(fetchUserGroups, getUserGroups()),
    call(fetchAllOS, getAllOperatingSystems()),
    call(fetchAllHosts, getAllHosts()),
    call(loadFilters),
  ])
  console.log('\u2714 data loads with no pre-reqs are complete')

  // requires user groups to be in redux store for authorization checks
  yield all([
    call(fetchDataCentersAndStorageDomains, getAllStorageDomains()),
    call(fetchAllTemplates, getAllTemplates()),
    call(fetchAllClusters, getAllClusters()),
    call(fetchAllVnicProfiles, getAllVnicProfiles()),
  ])
  console.log('\u2714 data loads that require user groups are complete')

  // requires storage domains to be in redux store
  yield call(fetchIsoFiles, getIsoFiles())
  console.log('\u2714 data loads that require storage domains are complete')

  // The `Vms` card view component will take care of loading pages of VMs and Pools as needed.
  // Loading VMs and Pools here is not necessary and will cause issues with `Vms`'s loading.
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

export default [
  takeEvery(LOGIN, login),
  takeEvery(LOGOUT, logout),
]
