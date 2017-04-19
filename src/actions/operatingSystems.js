import {
  GET_ALL_OS,
} from '../constants/index'

export function removeMissingOSs ({ osIdsToPreserve }) {
  return {
    type: 'REMOVE_MISSING_OSS',
    payload: {
      osIdsToPreserve,
    },
  }
}

export function getAllOperatingSystems () {
  return {
    type: GET_ALL_OS,
    payload: {},
  }
}

export function addAllOS ({ os }) {
  return {
    type: 'ADD_ALL_OS',
    payload: {
      os,
    },
  }
}
