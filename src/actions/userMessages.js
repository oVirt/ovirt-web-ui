import {
  ADD_LAST_VM_EVENTS,
  ADD_USER_MESSAGE,
  ADD_VM_EVENTS,
  AUTO_ACKNOWLEDGE,
  CLEAR_USER_MSGS,
  DISMISS_EVENT,
  DISMISS_USER_MSG,
  GET_ALL_EVENTS,
  GET_VM_EVENTS,
  SAVE_EVENT_FILTERS,
  SET_EVENT_SORT,
  SET_USERMSG_NOTIFIED,
  SET_SERVER_MESSAGES,
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

export function addVmEvents ({ events = [], vmId }) {
  return {
    type: ADD_VM_EVENTS,
    payload: {
      events,
      vmId,
    },
  }
}

export function addLastVmEvents ({ events = [], vmId }) {
  return {
    type: ADD_LAST_VM_EVENTS,
    payload: {
      events,
      vmId,
    },
  }
}

export function getVmEvents ({ vmId, vmName, newestEventId = 0, maxItems = 0 }) {
  return {
    type: GET_VM_EVENTS,
    payload: {
      vmId,
      vmName,
      newestEventId,
      maxItems,
    },
  }
}

export function setEventSort ({ sort }) {
  return {
    type: SET_EVENT_SORT,
    payload: {
      sort,
    },
  }
}

export function saveEventFilters ({ filters }) {
  return {
    type: SAVE_EVENT_FILTERS,
    payload: {
      filters,
    },
  }
}
