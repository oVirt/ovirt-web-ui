import { PERSIST_STATE, GET_VM, SCHEDULER__1_MIN, REDIRECT_URL } from '../constants'

export * from './error'
export * from './vm'
export * from './visibility'
export * from './editVmDialog' // TODO: remove this file
export * from './clusters'
export * from './operatingSystems'
export * from './templates'

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
