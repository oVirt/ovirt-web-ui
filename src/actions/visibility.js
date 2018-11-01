import {
  SELECT_POOL_DETAIL,
  SELECT_VM_DETAIL,
} from 'app-constants'

export function selectVmDetail ({ vmId }) {
  return {
    type: SELECT_VM_DETAIL,
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
