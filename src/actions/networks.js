import {
  GET_ALL_NETWORKS,
} from '../constants/index'

export function removeMissingNetworks ({ networkIdsToPreserve }) {
  return {
    type: 'REMOVE_MISSING_NETWORKS',
    payload: {
      networkIdsToPreserve,
    },
  }
}

export function addNetworks ({ networks }) {
  return {
    type: 'ADD_NETWORKS',
    payload: {
      networks,
    },
  }
}

export function getAllNetworks () {
  return {
    type: GET_ALL_NETWORKS,
    payload: {},
  }
}
