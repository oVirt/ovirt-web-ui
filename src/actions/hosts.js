import {
  GET_ALL_HOSTS,
  GET_SINGLE_HOST,
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

export function removeHost ({ id }) {
  return {
    type: 'REMOVE_HOST',
    payload: {
      id,
    },
  }
}

export function getAllHosts () {
  return {
    type: GET_ALL_HOSTS,
    payload: {},
  }
}

export function getSingleHost ({ id }) {
  return {
    type: GET_SINGLE_HOST,
    payload: {
      id,
    },
  }
}
