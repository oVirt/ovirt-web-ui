import {
  CHECK_CONSOLE_IN_USE,
  DOWNLOAD_CONSOLE_VM,
  SET_CONSOLE_IN_USE,
  SET_CONSOLE_LOGON,
} from '_/constants'

export function setConsoleInUse ({ vmId, consoleInUse }) {
  return {
    type: SET_CONSOLE_IN_USE,
    payload: {
      vmId,
      consoleInUse,
    },
  }
}

export function setConsoleLogon ({ vmId, isLogon }) {
  return {
    type: SET_CONSOLE_LOGON,
    payload: {
      vmId,
      isLogon,
    },
  }
}

export function checkConsoleInUse ({ vmId, usbFilter, userId, hasGuestAgent }) {
  return {
    type: CHECK_CONSOLE_IN_USE,
    payload: {
      vmId,
      usbFilter,
      userId,
      hasGuestAgent,
    },
  }
}

export function downloadConsole ({ vmId, consoleId, usbFilter, hasGuestAgent, skipSSO }) {
  return {
    type: DOWNLOAD_CONSOLE_VM,
    payload: {
      vmId,
      consoleId,
      usbFilter,
      hasGuestAgent,
      skipSSO,
    },
  }
}
