import {
  ADD_USER_MESSAGE,
  CLEAR_USER_MSGS,
  DISMISS_EVENT,
  DISMISS_USER_MSG,
  SET_USERMSG_NOTIFIED,
  SET_USER_MESSAGES,
  GET_ALL_EVENTS,
} from '_/constants'

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
  return { type: CLEAR_USER_MSGS }
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

export function dismissEvent ({ event }) {
  return {
    type: DISMISS_EVENT,
    payload: {
      event,
    },
  }
}

export function setUserMessages ({ messages }) {
  return {
    type: SET_USER_MESSAGES,
    payload: {
      messages,
    },
  }
}

export function getAllEvents () {
  return { type: GET_ALL_EVENTS }
}
