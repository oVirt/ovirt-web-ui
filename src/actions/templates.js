import {
  SET_TEMPLATES,
} from '_/constants'

export function setTemplates (templates) {
  return {
    type: SET_TEMPLATES,
    payload: {
      templates,
    },
  }
}
