import { all, call, put, takeEvery, select } from 'redux-saga/effects'
import pick from 'lodash/pick'

import Product from '_/version'
import Api, { Transforms } from '_/ovirtapi'
import AppConfiguration from '_/config'
import OptionsManager from '_/optionsManager'

import {
  loginSuccessful,
  loginFailed,
  appConfigured,

  failedExternalAction,
  setOvirtApiVersion,

  setUserFilterPermission,
  setAdministrator,
  getAllEvents,

  getAllClusters,
  getAllHosts,
  getAllOperatingSystems,
  getAllStorageDomains,
  getAllTemplates,
  getAllVnicProfiles,
  getRoles,
  getUserGroups,
  getUser,

  downloadConsole,
  getSingleVm,

  updateVms,
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
  fetchAllVnicProfiles,
  fetchAllTemplates,
  fetchUserGroups,
} from './base-data'
import { downloadVmConsole } from './console'
import { fetchRoles } from './roles'
import { fetchServerConfiguredValues, fetchGeneralEngineOption } from './server-configs'
import { fetchDataCentersAndStorageDomains, fetchIsoFiles } from './storageDomains'
import { loadIconsFromLocalStorage } from './osIcons'
import {
  transformAndPermitVm,
  fetchCurrentUser,
} from './index'

import { loadFromLocalStorage, removeFromLocalStorage } from '_/storage'
import { loadUserOptions } from './options'

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
      messageDescriptor: { id: 'apiVersionCheckFailed' },
    }))
    return
  }
  console.groupEnd('Login Verification')

  // API checks passed.  Load user data and the initial app data
  console.group('Login Data Fetch')

  console.group('user checks and server config')
  yield all([
    call(checkUserFilterPermissions),
    call(fetchServerConfiguredValues),
  ])
  console.log('\u2714 login checks and server config fetches are done:',
    yield select(state => pick(
      state.config.toJS(),
      [ 'administrator', 'filter', 'domain', 'user', 'userSessionTimeoutInterval', 'websocket', 'cpuTopology' ]))
  )
  console.groupEnd('user checks and server config')

  yield initialLoad()
  console.groupEnd('Login Data Fetch')

  // The first page of VMs and Pools are loaded by the background-refresh sagas when the
  // `react-router-config` loads the route '/'.  Loading of additional pages is handled by
  // user interaction (scrolling) on the `Vms` card view component.

  yield put(appConfigured())
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
  if (!isValidOvirtMeta(oVirtMeta)) {
    console.error('Incompatible oVirt API version: ', oVirtMeta)
    yield put(setOvirtApiVersion({ passed: false, ...oVirtMeta }))
    return false
  }

  const actual = Transforms.Version.toInternal(oVirtMeta['product_info']['version'])
  const required = Product.ovirtApiVersionRequired
  const passed = compareVersion(actual, required)

  yield put(setOvirtApiVersion({ passed, ...actual }))
  return passed
}

function isValidOvirtMeta (oVirtMeta) {
  return oVirtMeta &&
        oVirtMeta['product_info'] &&
        oVirtMeta['product_info']['version'] &&
        oVirtMeta['product_info']['version']['major'] &&
        oVirtMeta['product_info']['version']['minor'] &&
        oVirtMeta['product_info']['version']['build']
}

function composeIncompatibleOVirtApiVersionMessage (oVirtMeta) {
  const requested = `${Product.ovirtApiVersionRequired.major}.${Product.ovirtApiVersionRequired.minor}`
  let found
  if (!isValidOvirtMeta(oVirtMeta)) {
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

  const alwaysFilterOption = yield fetchGeneralEngineOption('AlwaysFilterResultsForWebUi', 'false')
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
  console.group('no data prerequisites')
  yield all([
    call(loadIconsFromLocalStorage),
    call(fetchRoles, getRoles()),
    call(fetchCurrentUser, getUser()),
    call(fetchUserGroups, getUserGroups()),
    call(fetchAllOS, getAllOperatingSystems()),
    call(fetchAllHosts, getAllHosts()),
    call(loadFilters),
    call(loadUserOptions),
  ])
  console.log('\u2714 data loads with no prerequisites are complete')
  console.groupEnd('no data prerequisites')

  // requires user groups and roles to be in redux store for authorization checks
  console.group('needs user groups and roles')
  yield all([
    call(fetchDataCentersAndStorageDomains, getAllStorageDomains()),
    call(fetchAllTemplates, getAllTemplates()),
    call(fetchAllClusters, getAllClusters()),
    call(fetchAllVnicProfiles, getAllVnicProfiles()),
  ])
  console.log('\u2714 data loads that require user groups and roles are complete')
  console.groupEnd('needs user groups and roles')

  // requires storage domains to be in redux store
  console.group('needs storage domains')
  yield call(fetchIsoFiles)
  console.log('\u2714 data loads that require storage domains are complete')
  console.groupEnd('needs storage domains')

  // delete options left in local storage by older versions
  removeFromLocalStorage('options')

  // Vms and Pools are loaded as needed / accessed
}

function* autoConnectCheck () {
  const vmId = OptionsManager.loadAutoConnectOption()
  if (vmId && vmId.length > 0) {
    const vm = yield callExternalAction('getVm', Api.getVm, getSingleVm({ vmId }), true)
    if (vm && vm.error && vm.error.status === 404) {
      OptionsManager.clearAutoConnect()
    } else if (vm && vm.id && vm.status !== 'down') {
      const internalVm = yield transformAndPermitVm(vm)
      yield put(updateVms({ vms: [internalVm] }))
      yield downloadVmConsole(downloadConsole({ vmId, hasGuestAgent: internalVm.ssoGuestAgent }))
    }
  }
}

export default [
  takeEvery(LOGIN, login),
  takeEvery(LOGOUT, logout),
]
