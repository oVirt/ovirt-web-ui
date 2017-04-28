import {
  PERSIST_STATE,
  GET_VM,
  SCHEDULER__1_MIN,
  REDIRECT_URL,
  SET_USER_FILTER_PERMISSION,
  CHANGE_FILTER_PERMISSION,
  SET_ADMINISTATOR,
} from '../constants'

export * from './error'
export * from './vm'
export * from './visibility'
export * from './clusters'
export * from './operatingSystems'
export * from './templates'
export * from './options'

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

export function setRedirectUrl (redirectUrl) {
  return {
    type: REDIRECT_URL,
    payload: {
      redirectUrl,
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

export function changeFilterPermissions (filter) {
  return {
    type: CHANGE_FILTER_PERMISSION,
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
