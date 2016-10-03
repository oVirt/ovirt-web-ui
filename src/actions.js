import {logDebug} from './helpers'
// --- External actions -----------------------
export function login ({username, password}) {
  return {
    type: 'LOGIN',
    payload: {
      credentials: {
        username,
        password
      }
    }
  }
}

export function getAllVms () {
  return {
    type: 'GET_ALL_VMS',
    payload: {}
  }
}

export function getVmIcons ({vm}) {
  return {
    type: 'GET_VM_ICONS',
    payload: {
      vm
    }
  }
}

export function shutdownVm ({vmId, force=false}) {
  return {
    type: 'SHUTDOWN_VM',
    payload: {
      vmId,
      force
    }
  }
}

export function restartVm ({vmId, force=false}) {
  return {
    type: 'RESTART_VM',
    payload: {
      vmId,
      force
    }
  }
}

export function startVm ({vmId}) {
  return {
    type: 'START_VM',
    payload: {
      vmId
    }
  }
}

export function getConsole ({vmId}) {
  return {
    type: 'GET_CONSOLE_VM',
    payload: {
      vmId
    }
  }
}

// --- Internal State -------------------------
export function loginSuccessful ({token, username}) {
  return {
    type: 'LOGIN_SUCCESSFUL',
    payload: {
      token,
      username
    }
  }
}

export function loginFailed ({errorCode, message}) {
  return {
    type: 'LOGIN_FAILED',
    payload: {
      errorCode,
      message
    }
  }
}

export function logout () {
  return {
    type: 'LOGOUT',
    payload: {
    }
  }
}

/**
 * Update or Add
 * @param vm
 * @returns {{type: string, payload: {vm: *}}}
 */
export function updateVm ({vm}) {
  return {
    type: 'UPDATE_VM',
    payload: {
      vm
    }
  }
}

export function updateVmIcon ({vmId, icon, type}) {
  logDebug(`-- updateVmIcon(): ${vmId}, ${icon}, ${type}`)
  return {
    type: 'UPDATE_VM_ICON',
    payload: {
      vmId,
      icon,
      type
    }
  }
}

export function selectVmDetail ({vmId}) {
  return {
    type: 'SELECT_VM_DETAIL',
    payload: {
      vmId
    }
  }
}

export function closeVmDetail () {
  return {
    type: 'CLOSE_VM_DETAIL',
    payload: {
    }
  }
}

export function auditLogShow () {
  return {
    type: 'SHOW_AUDIT_LOG',
    payload: {
    }
  }
}

export function auditLogHide () {
  return {
    type: 'HIDE_AUDIT_LOG',
    payload: {
    }
  }
}

// --- FAILURES -------------------------------
export function failedExternalAction ({message, exception, action}) {
  if (exception) {
//    message = message ? message : (exception['responseText'] ? exception['responseText'] : (exception['statusText'] ? exception['statusText'] : 'UNKNOWN'))
    message = message ? message : (exception['statusText'] ? exception['statusText'] : 'UNKNOWN') // exception['responseText'] for content
    const type = exception['status'] ? exception['status'] : 'ERROR'
    return {
      type: 'FAILED_EXTERNAL_ACTION',
      payload: {
        message: message,
        type: type,
        action
      }
    }
  }

  return {
    type: 'FAILED_EXTERNAL_ACTION',
    payload: {
      message,
      action
    }
  }
}
