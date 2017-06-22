import {
  GET_ALL_HOSTS,
} from '../constants/index'

export function removeMissingHosts ({ hostIdsToPreserve }) {
  return {
    type: 'REMOVE_MISSING_HOSTS',
    payload: {
      hostIdsToPreserve,
    },
  }
}

export function addHosts ({ hosts }) {
  return {
    type: 'ADD_HOSTS',
    payload: {
      hosts,
    },
  }
}

export function getAllHosts () {
  return {
    type: GET_ALL_HOSTS,
    payload: {},
  }
}
