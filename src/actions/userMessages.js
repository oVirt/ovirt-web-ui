import {
  ADD_USER_MESSAGE,
  CLEAR_USER_MSGS,
  DISMISS_USER_MSG,
  SET_USERMSG_NOTIFIED,
} from '../constants'

export function addUserMessage ({ message, shortMessage, type = '' }) {
  return {
    type: ADD_USER_MESSAGE,
    payload: {
      message,
      shortMessage,
      type,
    },
  }
}

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
