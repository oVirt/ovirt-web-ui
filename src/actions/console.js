import { SET_CONSOLE_IN_USE, CHECK_CONSOLE_IN_USE } from '../constants'

export function setConsoleInUse ({ vmId, consoleInUse }) {
  return {
    type: SET_CONSOLE_IN_USE,
    payload: {
      vmId,
      consoleInUse,
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
