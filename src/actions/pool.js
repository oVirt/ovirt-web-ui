import AppConfiguration from '_/config'
import * as C from '_/constants'

export function getSinglePool ({ poolId }) {
  return {
    type: C.GET_POOL,
    payload: {
      poolId,
    },
  }
}

export function getAllPools () {
  return { type: C.GET_POOLS }
}

export function getPoolsByPage ({ page }) {
  return {
    type: C.GET_POOLS,
    payload: {
      page,
      count: AppConfiguration.pageLimit,
    },
  }
}

export function getPoolsByCount ({ count }) {
  return {
    type: C.GET_POOLS,
    payload: {
      count,
    },
  }
}

//
// ---- Pool Actions
//

export function startPool ({ poolId }) {
  return {
    type: C.START_POOL,
    payload: {
      poolId,
    },
  }
}

export function poolActionInProgress ({ poolId, name, started }) {
  return {
    type: C.POOL_ACTION_IN_PROGRESS,
    payload: {
      poolId,
      name,
      started,
    },
  }
}
