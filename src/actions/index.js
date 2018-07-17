import AppConfiguration from '../config'
import {
  CHECK_TOKEN_EXPIRED,
  GET_BY_PAGE,
  GET_OPTION,
  GET_USB_FILTER,
  GET_VM,
  PERSIST_STATE,
  SET_ADMINISTRATOR,
  SET_USB_FILTER,
  SET_USER_FILTER_PERMISSION,
  SHOW_TOKEN_EXPIRED_MSG,
  START_SCHEDULER_FIXED_DELAY,
  STOP_SCHEDULER_FIXED_DELAY,
} from '../constants'

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

export function startSchedulerFixedDelay (delayInSeconds = AppConfiguration.schedulerFixedDelayInSeconds) {
  return {
    type: START_SCHEDULER_FIXED_DELAY,
    payload: { delayInSeconds },
  }
}

export function stopSchedulerFixedDelay () {
  return {
    type: STOP_SCHEDULER_FIXED_DELAY,
    payload: {},
  }
}

export function persistState () {
  return {
    type: PERSIST_STATE,
    payload: {},
  }
}

/**
 * Not creator of an action. Returned object can't be dispatched to the store.
 */
export function getSingleVm ({ vmId, shallowFetch = false }) {
  return {
    type: GET_VM,
    payload: {
      vmId,
      shallowFetch,
    },
  }
}

export function setUserFilterPermission (filter) {
  return {
    type: SET_USER_FILTER_PERMISSION,
    payload: {
      filter,
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

export function checkTokenExpired () {
  return {
    type: CHECK_TOKEN_EXPIRED,
    payload: {},
  }
}

export function showTokenExpiredMessage () {
  return {
    type: SHOW_TOKEN_EXPIRED_MSG,
    payload: {},
  }
}

export function getByPage ({ page, shallowFetch = true }) {
  return {
    type: GET_BY_PAGE,
    payload: {
      shallowFetch,
      page,
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

export function getUSBFilter () {
  return {
    type: GET_USB_FILTER,
    payload: {},
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
