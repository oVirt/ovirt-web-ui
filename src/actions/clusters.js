import {
  GET_ALL_CLUSTERS,
} from '../constants/index'

export function removeMissingClusters ({ clusterIdsToPreserve }) {
  return {
    type: 'REMOVE_MISSING_CLUSTERS',
    payload: {
      clusterIdsToPreserve,
    },
  }
}

export function addClusters ({ clusters }) {
  return {
    type: 'ADD_CLUSTERS',
    payload: {
      clusters,
    },
  }
}

export function getAllClusters () {
  return {
    type: GET_ALL_CLUSTERS,
    payload: {},
  }
}
