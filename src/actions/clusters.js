import {
  GET_ALL_CLUSTERS,
  SET_CLUSTERS,
} from '../constants'

export function setClusters (clusters) {
  return {
    type: SET_CLUSTERS,
    payload: clusters,
  }
}

export function getAllClusters () {
  return {
    type: GET_ALL_CLUSTERS,
    payload: {},
  }
}
