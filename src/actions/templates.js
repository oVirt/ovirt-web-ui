import {
  GET_ALL_TEMPLATES,
  SET_TEMPLATES,
} from '_/constants'

/**
 * @param {Array<Object>} templates
 */
export function setTemplates (templates) {
  return {
    type: SET_TEMPLATES,
    payload: templates,
  }
}

export function getAllTemplates () {
  return {
    type: GET_ALL_TEMPLATES,
    payload: {},
  }
}
