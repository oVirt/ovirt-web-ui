import * as C from '_/constants'

export function openConsole ({
  consoleType,
  vmId,
  openInPage = false,
  skipSSO = false,
  logoutOtherUsers = false,
}) {
  return {
    type: C.OPEN_CONSOLE,
    payload: {
      consoleType,
      vmId,
      openInPage,
      skipSSO,
      logoutOtherUsers,
    },
  }
}

export function setConsoleTickets ({ vmId, proxyTicket, ticket }) {
  return {
    type: C.SET_CONSOLE_TICKETS,
    payload: {
      vmId,
      proxyTicket,
      ticket,
    },
  }
}

export function setConsoleStatus ({ vmId, status, reason, consoleType }) {
  return {
    type: C.SET_CONSOLE_STATUS,
    payload: {
      vmId,
      status,
      reason,
      consoleType,
    },
  }
}

export function addConsoleError ({
  vmId,
  vmName,
  consoleType,
  status,
  consoleId,
}) {
  return {
    type: C.ADD_CONSOLE_ERROR,
    payload: {
      vmId,
      vmName,
      consoleType,
      status,
      consoleId,
    },
  }
}

export function dismissConsoleError ({ vmId, consoleType }) {
  return {
    type: C.DISMISS_CONSOLE_ERROR,
    payload: {
      vmId,
      consoleType,
    },
  }
}
