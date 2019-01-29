import {
  SET_CONSOLE_IN_USE,
  CHECK_CONSOLE_IN_USE,
  SET_CONSOLE_LOGON,
  SET_CONSOLE_TICKETS,
  DOWNLOAD_CONSOLE_VM,
  SET_ACTIVE_CONSOLE, SET_CONSOLE_NVNC,
} from '../constants'

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

export function setActiveConsole ({ vmId, consoleId }) {
  return {
    type: SET_ACTIVE_CONSOLE,
    payload: {
      vmId,
      consoleId,
    },
  }
}

export function setConsoleNoVNC ({ vmId, isRunning }) {
  return {
    type: SET_CONSOLE_NVNC,
    payload: {
      vmId,
      isRunning,
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

export function setConsoleTickets ({ vmId, proxyTicket, ticket }) {
  return {
    type: SET_CONSOLE_TICKETS,
    payload: {
      vmId,
      proxyTicket,
      ticket,
    },
  }
}
