import {
  GET_POOL,
  GET_POOLS_BY_COUNT,
  GET_POOLS_BY_PAGE,
  POOL_ACTION_IN_PROGRESS,
  REMOVE_MISSING_POOLS,
  REMOVE_POOL,
  START_POOL,
  UPDATE_POOLS,
  UPDATE_VMPOOLS_COUNT,
} from 'app-constants'

export function getPoolsByPage ({ page }) {
  return {
    type: GET_POOLS_BY_PAGE,
    payload: {
      page,
    },
  }
}

export function getPoolsByCount ({ count }) {
  return {
    type: GET_POOLS_BY_COUNT,
    payload: {
      count,
    },
  }
}

export function startPool ({ poolId }) {
  return {
    type: START_POOL,
    payload: {
      poolId,
    },
  }
}

/**
 * Update or Add
 * @param pools - array of pools
 * @returns {{type: string, payload: {pools: *}}}
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
 * Remove Pools from store.
 *
 * @param poolIds array
 * @returns {{type: string, payload: {poolIds: *}}}
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
 * Remove all Pools from store which ID is not listed among poolIdsToPreserve
 * @param poolIdsToPreserve
 * @returns {{type: string, payload: {poolIds: *}}}
 */
export function removeMissingPools ({ poolIdsToPreserve }) {
  return {
    type: REMOVE_MISSING_POOLS,
    payload: {
      poolIdsToPreserve,
    },
  }
}

export function getSinglePool ({ poolId }) {
  return {
    type: GET_POOL,
    payload: {
      poolId,
    },
  }
}

export function updateVmsPoolsCount () {
  return {
    type: UPDATE_VMPOOLS_COUNT,
    payload: {
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
