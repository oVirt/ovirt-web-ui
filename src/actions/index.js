import {
  GET_SINGLE_VM,
  GET_BY_PAGE,
  GET_USB_FILTER,
  PERSIST_STATE,
  SET_ADMINISTATOR,
  SET_USER_FILTER_PERMISSION,
  CHECK_TOKEN_EXPIRED,
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
export * from './events'

export function persistState () {
  return {
    type: PERSIST_STATE,
    payload: {
    },
  }
}

export function getSingleVm ({ vmId }) {
  return {
    type: GET_SINGLE_VM,
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
