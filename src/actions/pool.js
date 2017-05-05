import {
  GET_ALL_POOLS,
  GET_POOL,
  POOL_ACTION_IN_PROGRESS,
  REMOVE_MISSING_POOLS,
  REMOVE_POOL,
  START_POOL,
  UPDATE_POOLS,
  UPDATE_VMPOOLS_COUNT,
} from '../constants/index'

/**
 * Read all Pools data and related subresources
 *
 * @param shallowFetch If true, only Pools and their (missing) icons are read,
 * otherwise full read/refresh
 *
 * @returns {{type: string, payload: {shallowFetch}}}
 */
export function getAllPools () {
  return {
    type: GET_ALL_POOLS,
    payload: {
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
