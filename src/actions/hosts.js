import {
  SET_HOSTS,
} from '_/constants'

export function setHosts (hosts) {
  return {
    type: SET_HOSTS,
    payload: hosts,
  }
}
