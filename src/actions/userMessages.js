import {
  ADD_USER_MESSAGE,
  AUTO_ACKNOWLEDGE,
  CLEAR_USER_MSGS,
  DISMISS_EVENT,
  DISMISS_USER_MSG,
  SET_USERMSG_NOTIFIED,
  SET_SERVER_MESSAGES,
  GET_ALL_EVENTS,
} from '_/constants'

export function addUserMessage ({ message, messageDescriptor, type = '' }) {
  return {
    type: ADD_USER_MESSAGE,
    payload: {
      message,
      messageDescriptor,
      type,
    },
  }
}

export function clearUserMessages (records = []) {
  return {
    type: CLEAR_USER_MSGS,
    payload: {
      records,
    },
  }
}

export function setAutoAcknowledge (autoAcknowledge) {
  return {
    type: AUTO_ACKNOWLEDGE,
    payload: {
      autoAcknowledge,
    },
  }
}

export function setNotificationNotified ({ eventId }) {
  return {
    type: SET_USERMSG_NOTIFIED,
    payload: {
      eventId,
    },
  }
}

export function dismissUserMessage ({ eventId }) {
  return {
    type: DISMISS_USER_MSG,
    payload: {
      eventId,
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

export function setServerMessages ({ messages }) {
  return {
    type: SET_SERVER_MESSAGES,
    payload: {
      messages,
    },
  }
}

export function getAllEvents () {
  return { type: GET_ALL_EVENTS }
}
