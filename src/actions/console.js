import { SET_CONSOLE_IN_USE, CHECK_CONSOLE_IN_USE, SET_CONSOLE_VALID } from 'app-constants'

export function setConsoleInUse ({ vmId, consoleInUse }) {
  return {
    type: SET_CONSOLE_IN_USE,
    payload: {
      vmId,
      consoleInUse,
    },
  }
}

export function setConsoleIsValid ({ vmId, isValid }) {
  return {
    type: SET_CONSOLE_VALID,
    payload: {
      vmId,
      isValid,
    },
  }
}

export function checkConsoleInUse ({ vmId, usbFilter, userId }) {
  return {
    type: CHECK_CONSOLE_IN_USE,
    payload: {
      vmId,
      usbFilter,
      userId,
    },
  }
}
