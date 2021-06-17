import {
  OPEN_CONSOLE_MODAL,
  SET_CONSOLE_NOVNC_STATUS,
  SET_CONSOLE_TICKETS,
  DOWNLOAD_CONSOLE_VM,
  SET_ACTIVE_CONSOLE,
  SET_NEW_CONSOLE_MODAL,
  CLOSE_CONSOLE_MODAL,
  SET_IN_USE_CONSOLE_MODAL_STATE,
  SET_LOGON_CONSOLE_MODAL_STATE,
} from '../constants'

export function openConsoleModal ({ vmId, usbAutoshare, usbFilter, userId, consoleId, hasGuestAgent, openInPage, isNoVNC, modalId }) {
  return {
    type: OPEN_CONSOLE_MODAL,
    payload: {
      vmId,
      usbAutoshare,
      usbFilter,
      userId,
      consoleId,
      hasGuestAgent,
      openInPage,
      isNoVNC,
      modalId,
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

export function downloadConsole ({ vmId, consoleId, usbAutoshare, usbFilter, hasGuestAgent, skipSSO, openInPage, isNoVNC, modalId }) {
  return {
    type: DOWNLOAD_CONSOLE_VM,
    payload: {
      vmId,
      consoleId,
      usbAutoshare,
      usbFilter,
      hasGuestAgent,
      skipSSO,
      openInPage,
      isNoVNC,
      modalId,
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

export function setConsoleStatus ({ vmId, status, reason }) {
  return {
    type: SET_CONSOLE_NOVNC_STATUS,
    payload: {
      vmId,
      status,
      reason,
    },
  }
}

export function setNewConsoleModal ({ modalId, vmId, consoleId }) {
  return {
    type: SET_NEW_CONSOLE_MODAL,
    payload: {
      modalId,
      vmId,
      consoleId,
    },
  }
}

export function closeConsoleModal ({ modalId }) {
  return {
    type: CLOSE_CONSOLE_MODAL,
    payload: {
      modalId,
    },
  }
}

export function setInUseConsoleModalState ({ modalId }) {
  return {
    type: SET_IN_USE_CONSOLE_MODAL_STATE,
    payload: {
      modalId,
    },
  }
}

export function setLogonConsoleModalState ({ modalId }) {
  return {
    type: SET_LOGON_CONSOLE_MODAL_STATE,
    payload: {
      modalId,
    },
  }
}
