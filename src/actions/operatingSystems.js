import {
  GET_ALL_OS,
  SET_OPERATING_SYSTEMS,
} from '../constants'

/**
 * @param {Array<OperatingSystem>} operatingSystems
 */
export function setOperatingSystems (operatingSystems) {
  return {
    type: SET_OPERATING_SYSTEMS,
    payload: operatingSystems,
  }
}

export function getAllOperatingSystems () {
  return {
    type: GET_ALL_OS,
    payload: {},
  }
}
