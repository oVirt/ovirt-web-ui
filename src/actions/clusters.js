import {
  GET_ALL_CLUSTERS,
  REMOVE_CLUSTER,
  GET_CLUSTER,
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

export function removeCluster ({ id }) {
  return {
    type: REMOVE_CLUSTER,
    payload: {
      id,
    },
  }
}

export function getAllClusters () {
  return {
    type: GET_ALL_CLUSTERS,
    payload: {},
  }
}

export function getCluster ({ id }) {
  return {
    type: GET_CLUSTER,
    payload: {
      id,
    },
  }
}

