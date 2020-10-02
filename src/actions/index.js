import AppConfiguration from '_/config'
import {
  APP_CONFIGURED,
  CHANGE_PAGE,
  CHECK_TOKEN_EXPIRED,
  GET_BY_PAGE,
  GET_OPTION,
  GET_USER,
  GET_USER_GROUPS,
  MANUAL_REFRESH,
  SET_ADMINISTRATOR,
  SET_CPU_TOPOLOGY_OPTIONS,
  SET_CURRENT_PAGE,
  SET_DEFAULT_TIMEZONE,
  SET_USB_AUTOSHARE,
  SET_USB_FILTER,
  SET_USER,
  SET_USER_FILTER_PERMISSION,
  SET_USER_GROUPS,
  SET_USER_SESSION_TIMEOUT_INTERVAL,
  SET_WEBSOCKET,
  SHOW_TOKEN_EXPIRED_MSG,
  START_SCHEDULER_FIXED_DELAY,
  STOP_SCHEDULER_FIXED_DELAY,
  UPDATE_PAGING_DATA,
} from '_/constants'

export * from './error'
export * from './vm'
export * from './visibility'
export * from './clusters'
export * from './hosts'
export * from './operatingSystems'
export * from './templates'
export * from './options'
export * from './pool'
export * from './storageDomains'
export * from './dataCenters'
export * from './pendingTasks'
export * from './vnicProfiles'
export * from './activeRequests'
export * from './console'
export * from './userMessages'
export * from './disks'
export * from './roles'

export function appConfigured () {
  return { type: APP_CONFIGURED }
}

export function manualRefresh () {
  return { type: MANUAL_REFRESH }
}

export function startSchedulerFixedDelay ({
  delayInSeconds = AppConfiguration.schedulerFixedDelayInSeconds,
  startDelayInSeconds = AppConfiguration.schedulerFixedDelayInSeconds,
  targetPage,
  pageRouterRefresh = false,
  manualRefresh = false,
}) {
  return {
    type: START_SCHEDULER_FIXED_DELAY,
    payload: { delayInSeconds, startDelayInSeconds, targetPage, pageRouterRefresh, manualRefresh },
  }
}

export function stopSchedulerFixedDelay () {
  return { type: STOP_SCHEDULER_FIXED_DELAY }
}

export function setUserFilterPermission (filter) {
  return {
    type: SET_USER_FILTER_PERMISSION,
    payload: {
      filter,
    },
  }
}

export function setUserSessionTimeoutInternal (userSessionTimeoutInterval) {
  return {
    type: SET_USER_SESSION_TIMEOUT_INTERVAL,
    payload: {
      userSessionTimeoutInterval,
    },
  }
}

export function setWebsocket (websocket) {
  return {
    type: SET_WEBSOCKET,
    payload: {
      websocket,
    },
  }
}

export function setAdministrator (administrator) {
  return {
    type: SET_ADMINISTRATOR,
    payload: {
      administrator,
    },
  }
}

export function setCurrentPage ({ type, id }) {
  return {
    type: SET_CURRENT_PAGE,
    payload: {
      type,
      id,
    },
  }
}

export function changePage ({ type, id }) {
  return {
    type: CHANGE_PAGE,
    payload: {
      type,
      id,
    },
  }
}

export function checkTokenExpired () {
  return { type: CHECK_TOKEN_EXPIRED }
}

export function showTokenExpiredMessage () {
  return { type: SHOW_TOKEN_EXPIRED_MSG }
}

export function getByPage () {
  return { type: GET_BY_PAGE }
}

export function updatePagingData ({ vmsPage, vmsExpectMorePages, poolsPage, poolsExpectMorePages }) {
  return {
    type: UPDATE_PAGING_DATA,
    payload: {
      vmsPage,
      vmsExpectMorePages,
      poolsPage,
      poolsExpectMorePages,
    },
  }
}

export function setUSBFilter ({ usbFilter }) {
  return {
    type: SET_USB_FILTER,
    payload: {
      usbFilter,
    },
  }
}

export function setSpiceUsbAutoShare (usbAutoshare) {
  return {
    type: SET_USB_AUTOSHARE,
    payload: {
      usbAutoshare,
    },
  }
}

/**
 * @param {string} optionName
 * @param {OptionVersionType} version option version
 * @param {string=} defaultValue
 */
export function getOption (optionName, version, defaultValue) {
  return {
    type: GET_OPTION,
    payload: {
      optionName,
      version,
      defaultValue,
    },
  }
}

export function setUserGroups ({ groups }) {
  return {
    type: SET_USER_GROUPS,
    payload: {
      groups,
    },
  }
}

export function getUserGroups () {
  return { type: GET_USER_GROUPS }
}

export function setUser ({ user }) {
  return {
    type: SET_USER,
    payload: {
      user,
    },
  }
}

export function getUser () {
  return { type: GET_USER }
}

export function setCpuTopologyOptions ({
  maxNumberOfSockets,
  maxNumberOfCores,
  maxNumberOfThreads,
  maxNumOfVmCpus,
}) {
  return {
    type: SET_CPU_TOPOLOGY_OPTIONS,
    payload: {
      maxNumberOfSockets,
      maxNumberOfCores,
      maxNumberOfThreads,
      maxNumOfVmCpus,
    },
  }
}

export function setDefaultTimezone ({
  defaultGeneralTimezone,
  defaultWindowsTimezone,
}) {
  return {
    type: SET_DEFAULT_TIMEZONE,
    payload: {
      defaultGeneralTimezone,
      defaultWindowsTimezone,
    },
  }
}
