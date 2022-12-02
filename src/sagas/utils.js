import {
  call,
  fork,
  put,
  race,
  select,
  take,
} from 'redux-saga/effects'

import AppConfiguration from '_/config'
import { hidePassword, toJS } from '_/helpers'
import Api from '_/ovirtapi'
import semverGte from 'semver/functions/gte'
import semverValid from 'semver/functions/valid'

import {
  DEFAULT_ARCH,
  DEFAULT_ENGINE_OPTION_VERSION,
} from '_/constants'

import {
  checkTokenExpired,
  failedExternalAction,
  showTokenExpiredMessage,
} from '_/actions'

/**
 * Resolve a promise with the given value (default to `true`) after the given delay (in milliseconds)
 */
export const delay = (ms, value = true) => new Promise(resolve => setTimeout(resolve, ms, value))

// TODO: Remove after an upgrade to a redux-saga version that includes this effect
// Adapted from https://redux-saga.js.org/docs/api#debouncems-pattern-saga-args
export function* debounce (interval, pattern, saga) {
  while (true) {
    let action = yield take(pattern)

    while (true) {
      const { debounced, latestAction } = yield race({
        debounced: delay(interval),
        latestAction: take(pattern),
      })

      if (debounced) {
        yield fork(saga, action)
        break
      }

      action = latestAction
    }
  }
}

/**
 * Compare the actual { major, minor, build} version to the required { major, minor} and
 * return if the **actual** is greater then or equal to **required**.
 *
 * Backward compatibility of the API is assumed.
 */
export function compareVersion (actual, required) {
  const fullActual = `${actual.major}.${actual.minor}.${actual.build}`
  const fullRequired = `${required.major}.${required.minor}.0`
  console.log(`compareVersion(), actual=${fullActual}, required=${fullRequired}`)
  return !!semverValid(fullActual) && semverGte(fullActual, fullRequired)
}

export function* callExternalAction (method, action = {}, canBeMissing = false) {
  try {
    console.log(`External action: ${JSON.stringify(hidePassword({ action }))}, API method: ${method.name}`)
    const result = yield call(method, action.payload || {})
    return result
  } catch (e) {
    if (!canBeMissing) {
      console.log(`External action exception: ${JSON.stringify(e)}`)

      if (e.status === 401) { // Unauthorized
        yield put(checkTokenExpired())
      }

      let titleDescriptor = shortErrorMessage({ action })
      if (e.status === 0 && e.statusText === 'error') { // special case, mixing https and http
        titleDescriptor = { id: 'apiConnectionFailed' }
        e.statusText = 'Unable to connect to oVirt REST API. Please check URL and protocol (https).'
      }

      yield put(failedExternalAction({
        exception: e,
        titleDescriptor,
        failedAction: action,
      }))
    }
    return { error: e }
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

const shortMessages = {
  START_VM: 'failedToStartVm',
  RESTART_VM: 'failedToRestartVm',
  SHUTDOWN_VM: 'failedToShutdownVm',
  SUSPEND_VM: 'failedToSuspendVm',
  REMOVE_VM: 'failedToRemoveVm',

  GET_ICON: 'failedToRetrieveVmIcon',
  INTERNAL_CONSOLE: 'failedToRetrieveVmConsoleDetails',
  INTERNAL_CONSOLES: 'failedToRetrieveListOfVmConsoles',
  GET_DISK_DETAILS: 'failedToRetrieveDiskDetails',
  GET_DISK_ATTACHMENTS: 'failedToRetrieveVmDisks',
  GET_ISO_FILES: 'failedToRetrieveIsoStorages',

  GET_VM: 'failedToRetrieveVmDetails',
  CHANGE_VM_ICON: 'failedToChangeVmIcon',
  CHANGE_VM_ICON_BY_ID: 'failedToChangeVmIconToDefault',
}

function shortErrorMessage ({ action: { type = 'NONE' } }) {
  if (shortMessages[type]) {
    return { id: shortMessages[type] }
  }
  return { id: 'actionFailed', params: { action: type } }
}

/**
 * Generate a series of `count` numbers in a `2000 * log2` progression for use as a series
 * of millisecond delays. This is useful for progressively waiting a bit longer between
 * REST polling calls.
 *
 * @param {number} count Number of steps to generate, default to 20
 * @param {number} msMultiplier Millisecond multiplier at each step (each step will be at least
 *                              this big), default to 2000
 */
export function* delayInMsSteps (count = 20, msMultiplier = 2000) {
  for (let i = 2; i < (count + 2); i++) {
    yield Math.round(Math.log2(i) * msMultiplier)
  }
}

export function* selectorUserAndRoles () {
  const userAndRoles = yield select(state => ({
    userGroups: state.config.get('userGroups'),
    userId: state.config.getIn(['user', 'id']),
    roles: state.roles,
  }))

  return userAndRoles
}

/**
 * Lookup users and roles from the redux store and convert an entity's set of permissions
 * to a set of permits for the app's current user.  Function `mapEntityPermits` is called
 * to do the actual mapping.
 *
 * NOTE: For effiency sake, use the cached lookup version `cacheEntityPermissionsToUserPermits`
 * in calling code.  This helps keep the redux-saga effect queue small and memory use efficient.
 */
export function* entityPermissionsToUserPermits (entity) {
  const userAndRoles = yield selectorUserAndRoles()
  return mapEntityPermits(entity, userAndRoles)
}

/**
 * Curry `mapEntityPermits` with a single lookup of user and roles from the redux store.
 *
 * NOTE: This version is most useful when processing multiple entities at a time.
 *
 * @returns A function that will convert an entity's set of permissions to a set of
 *          permits using a shared set of user and roles data.
 */
export function* curryEntityPermissionsToUserPermits () {
  const userAndRoles = yield selectorUserAndRoles()
  return (entity, ...rest) => mapEntityPermits(entity, userAndRoles, ...rest)
}

/**
 * Convert an entity's set of permissions to a set of permits for the app's current
 * user by mapping the permissions through their assigned roles to the permits.
 *
 * NOTE: If the user is an admin user the user's group and id membership must be
 * explicitly checked.
 */
function mapEntityPermits (entity, { userGroups, userId, roles } = {}) {
  const permissions = entity.permissions
    ? Array.isArray(entity.permissions) ? entity.permissions : [entity.permissions]
    : []

  const permitNames = new Set()
  for (const permission of permissions) {
    if (
      (permission.groupId && userGroups.includes(permission.groupId)) ||
      (permission.userId && permission.userId === userId)
    ) {
      const role = roles[permission.roleId]
      if (!role) {
        console.info('Could not find role in redux state, roleId:', permission.roleId)
      } else {
        role.permitNames.forEach(name => permitNames.add(name))
      }
    }
  }

  return Array.from(permitNames)
}

/**
 * Map an entity's cpuOptions config values from engine options. The mappings are based
 * on the (custom)? compatibility version and CPU architecture.
 */
export function* mapCpuOptions (version, architecture) {
  const [maxNumSockets, maxNumOfCores, maxNumOfThreads, maxNumOfVmCpusPerArch] =
    yield select(({ config }) => [
      config.getIn(['cpuOptions', 'maxNumOfSockets']),
      config.getIn(['cpuOptions', 'maxNumOfCores']),
      config.getIn(['cpuOptions', 'maxNumOfThreads']),
      config.getIn(['cpuOptions', 'maxNumOfVmCpusPerArch']),
    ])

  const maxNumOfVmCpusPerArch_ = toJS(maxNumOfVmCpusPerArch.get(version) || maxNumOfVmCpusPerArch.get(DEFAULT_ENGINE_OPTION_VERSION))

  return {
    maxNumOfSockets: maxNumSockets.get(version) || maxNumSockets.get(DEFAULT_ENGINE_OPTION_VERSION),
    maxNumOfCores: maxNumOfCores.get(version) || maxNumOfCores.get(DEFAULT_ENGINE_OPTION_VERSION),
    maxNumOfThreads: maxNumOfThreads.get(version) || maxNumOfThreads.get(DEFAULT_ENGINE_OPTION_VERSION),
    maxNumOfVmCpus: maxNumOfVmCpusPerArch_[architecture] || maxNumOfVmCpusPerArch_[DEFAULT_ARCH],
  }
}

/**
 * Map an entity's cluster version to the given redux `config.configValue` key.
 *
 * @param {string} configKey Configuration key in the `config.configValues` redux store
 * @param {string} version Cluster version
 * @param {*} defaultValue Value to return if key or version for the key is not found
 */
export function* mapConfigKeyVersion (configKey, version, defaultValue) {
  const configValue = yield select(({ config }) => toJS(config.get(configKey, {})))

  let value = defaultValue
  if (version in configValue) {
    value = configValue[version]
  }
  return value
}
