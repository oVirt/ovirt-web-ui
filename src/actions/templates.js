import {
  GET_ALL_TEMPLATES,
  SET_TEMPLATES,
} from '_/constants'

export function getAllTemplates () {
  return { type: GET_ALL_TEMPLATES }
}

export function setTemplates (templates) {
  return {
    type: SET_TEMPLATES,
    payload: {
      templates,
    },
  }
}
