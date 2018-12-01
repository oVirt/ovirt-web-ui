import {
  GET_ALL_HOSTS,
  SET_HOSTS,
} from '_/constants'

export function setHosts (hosts) {
  return {
    type: SET_HOSTS,
    payload: hosts,
  }
}

export function getAllHosts () {
  return {
    type: GET_ALL_HOSTS,
    payload: {},
  }
}
