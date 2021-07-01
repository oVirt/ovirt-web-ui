import {
  SET_OPERATING_SYSTEMS,
} from '_/constants'

/**
 * @param {Array<OperatingSystem>} operatingSystems
 */
export function setOperatingSystems (operatingSystems) {
  return {
    type: SET_OPERATING_SYSTEMS,
    payload: operatingSystems,
  }
}
