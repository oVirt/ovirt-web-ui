import { SET_CONSOLE_IN_USE, CONSOLE_IN_USE } from './constants'

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
    type: CONSOLE_IN_USE,
    payload: {
      vmId,
      usbFilter,
      userId,
    },
  }
}
