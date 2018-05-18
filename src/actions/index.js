import AppConfiguration from '../config'
import {
  GET_VM,
  GET_BY_PAGE,
  GET_OPTION,
  GET_USB_FILTER,
  PERSIST_STATE,
  SET_ADMINISTATOR,
  SET_USER_FILTER_PERMISSION,
  CHECK_TOKEN_EXPIRED,
  START_SCHEDULER_FIXED_DELAY,
  STOP_SCHEDULER_FIXED_DELAY,
} from '../constants/index'

export * from './error'
export * from './vm'
export * from './visibility'
export * from './clusters'
export * from './hosts'
export * from './operatingSystems'
export * from './templates'
export * from './options'
export * from './pool'
export * from './route'
export * from './storage'
export * from './storageDomains'
export * from './dataCenters'
export * from './pendingTasks'
export * from './vnicProfiles'
export * from './activeRequests'

export function startSchedulerFixedDelay ({ delayInSeconds } = { delayInSeconds: AppConfiguration.schedulerFixedDelayInSeconds }) {
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

export function enableScheduler ({ enabled = true }) {
  return {
    type: 'ENABLE_SCHEDULER',
    payload: { enabled },
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
export function getSingleVm ({ vmId }) {
  return {
    type: GET_VM,
    payload: {
      vmId,
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
    type: SET_ADMINISTATOR,
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
    type: 'SHOW_TOKEN_EXPIRED_MSG',
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
    type: 'SET_USB_FILTER',
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
