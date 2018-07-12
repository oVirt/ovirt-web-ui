import {
  CLEAR_USER_MSGS,
  SET_USERMSG_NOTIFIED,
  DISMISS_USER_MSG,
} from '../constants'

export function clearUserMessages () {
  return {
    type: CLEAR_USER_MSGS,
    payload: {},
  }
}

export function setNotificationNotified ({ time }) {
  return {
    type: SET_USERMSG_NOTIFIED,
    payload: {
      time,
    },
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
