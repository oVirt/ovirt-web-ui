import {
  GET_VM,
  PERSIST_STATE,
  SCHEDULER__1_MIN,
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

export function persistState () {
  return {
    type: PERSIST_STATE,
    payload: {
    },
  }
}

export function getSingleVm ({ vmId }) {
  return {
    type: GET_VM,
    payload: {
      vmId,
    },
  }
}

export function schedulerOneMinute () {
  return {
    type: SCHEDULER__1_MIN,
    payload: {},
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
