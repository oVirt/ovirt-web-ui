import {
  SET_CLUSTERS,
} from '_/constants'

export function setClusters (clusters) {
  return {
    type: SET_CLUSTERS,
    payload: clusters,
  }
}
