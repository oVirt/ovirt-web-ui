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

export function shutdownVm ({vm, force=false}) {
  return {
    type: 'SHUTDOWN_VM',
    payload: {
      vm,
      force
    }
  }
}

export function restartVm ({vm, force=false}) {
  return {
    type: 'RESTART_VM',
    payload: {
      vm,
      force
    }
  }
}

export function startVm ({vm}) {
  return {
    type: 'START_VM',
    payload: {
      vm
    }
  }
}

export function getConsole ({vm}) {
  return {
    type: 'GET_CONSOLE_VM',
    payload: {
      vm
    }
  }
}

// --- Internal State -------------------------
export function loginSuccessful ({token}) {
  return {
    type: 'LOGIN_SUCCESSFUL',
    payload: {
      token
    }
  }
}

export function loginFailed () {
  return {
    type: 'LOGIN_FAILED',
    payload: {
    }
  }
}

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

export function selectVmDetail ({vm}) {
  return {
    type: 'SELECT_VM_DETAIL',
    payload: {
      vm
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

// --- FAILURES -------------------------------
export function failedExternalAction ({message, action}) {
  return {
    type: 'FAILED_EXTERNAL_ACTION',
    payload: {
      message,
      action
    }
  }
}