import {
  SELECT_POOL_DETAIL,
} from '../constants/index'

export function toggleOptions () {
  return {
    type: 'TOGGLE_OPTIONS',
    payload: {
    },
  }
}

export function selectVmDetail ({ vmId }) {
  return {
    type: 'SELECT_VM_DETAIL',
    payload: {
      vmId,
    },
  }
}

export function selectPoolDetail ({ poolId }) {
  return {
    type: SELECT_POOL_DETAIL,
    payload: {
      poolId,
    },
  }
}

export function closeDialog ({ force = false }) {
  return {
    type: 'CLOSE_DIALOG',
    payload: {
      force,
    },
  }
}
