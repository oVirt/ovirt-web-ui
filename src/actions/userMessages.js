import {
  CLEAR_USER_MSGS,
  DISMISS_USER_MSG,
  DISPLAY_USER_MSGS,
} from '../constants'

export function clearUserMessages () {
  return {
    type: CLEAR_USER_MSGS,
    payload: {},
  }
}

export function dismissUserMessage ({ time }) {
  return {
    type: DISMISS_USER_MSG,
    payload: {
      time,
    },
  }
}

export function displayUserMessages () {
  return {
    type: DISPLAY_USER_MSGS,
    payload: {},
  }
}
