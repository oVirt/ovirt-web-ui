import AppConfiguration from '_/config'
import {
  GET_POOL,
  GET_POOLS,
  POOL_ACTION_IN_PROGRESS,
  REMOVE_MISSING_POOLS,
  REMOVE_POOL,
  START_POOL,
  UPDATE_POOLS,
  UPDATE_VMPOOLS_COUNT,
} from '_/constants'

export function getSinglePool ({ poolId }) {
  return {
    type: GET_POOL,
    payload: {
      poolId,
    },
  }
}

export function getAllPools () {
  return { type: GET_POOLS }
}

export function getPoolsByPage ({ page }) {
  return {
    type: GET_POOLS,
    payload: {
      page,
      count: AppConfiguration.pageLimit,
    },
  }
}

export function getPoolsByCount ({ count }) {
  return {
    type: GET_POOLS,
    payload: {
      count,
    },
  }
}

/**
 * Update the set of Pools in the store
 */
export function updatePools ({ pools, copySubResources = false }) {
  return {
    type: UPDATE_POOLS,
    payload: {
      pools,
    },
  }
}

/**
 * Remove a set of Pools from the store
 */
export function removePools ({ poolIds }) {
  return {
    type: REMOVE_POOL,
    payload: {
      poolIds,
    },
  }
}

/**
 * Remove all Pools from the store whose ID is not listed among poolIdsToPreserve
 */
export function removeMissingPools ({ poolIdsToPreserve }) {
  return {
    type: REMOVE_MISSING_POOLS,
    payload: {
      poolIdsToPreserve,
    },
  }
}

export function updateVmsPoolsCount () {
  return { type: UPDATE_VMPOOLS_COUNT }
}

//
// ---- Pool Actions
//

export function startPool ({ poolId }) {
  return {
    type: START_POOL,
    payload: {
      poolId,
    },
  }
}

export function poolActionInProgress ({ poolId, name, started }) {
  return {
    type: POOL_ACTION_IN_PROGRESS,
    payload: {
      poolId,
      name,
      started,
    },
  }
}
