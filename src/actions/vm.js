import {
  LOGIN,
  GET_ALL_VMS,
  SHUTDOWN_VM,
  RESTART_VM,
  START_VM,
  GET_CONSOLE_VM,
  SUSPEND_VM,
  LOGIN_SUCCESSFUL,
  LOGOUT,
  CLEAR_USER_MSGS,
  SET_LOAD_IN_PROGRESS,
  UPDATE_VMS,
  REMOVE_VMS,
  REMOVE_MISSING_VMS,
  UPDATE_ICONS,
  SET_VM_DISKS,
  VM_ACTION_IN_PROGRESS,
  SET_VM_CONSOLES,
  SET_OVIRT_API_VERSION,
  ADD_NEW_VM,
  EDIT_VM,
} from '../constants'

export function login ({ username, password, token }) {
  return {
    type: LOGIN,
    payload: {
      credentials: {
        username,
        password,
      },
      token,
    },
  }
}

/**
 * Read all VMs data and related subresources
 *
 * @param shallowFetch If true, only VMs and their (missing) icons are read,
 * otherwise full read/refresh
 *
 * @returns {{type: string, payload: {shallowFetch}}}
 */
export function getAllVms ({ shallowFetch = false }) {
  return {
    type: GET_ALL_VMS,
    payload: {
      shallowFetch,
    },
  }
}

export function shutdownVm ({ vmId, force = false }) {
  return {
    type: SHUTDOWN_VM,
    payload: {
      vmId,
      force,
    },
  }
}

export function restartVm ({ vmId, force = false }) {
  return {
    type: RESTART_VM,
    payload: {
      vmId,
      force,
    },
  }
}

export function startVm ({ vmId }) {
  return {
    type: START_VM,
    payload: {
      vmId,
    },
  }
}

export function getConsole ({ vmId, consoleId }) {
  return {
    type: GET_CONSOLE_VM,
    payload: {
      vmId,
      consoleId,
    },
  }
}

export function suspendVm ({ vmId }) {
  return {
    type: SUSPEND_VM,
    payload: {
      vmId,
    },
  }
}

/**
 * New VM will be created in oVirt (REST API)
 */
export function createVm (vm, actionUniqueId) {
  return {
    type: ADD_NEW_VM,
    actionUniqueId,
    payload: {
      vm,
    },
  }
}

/**
 * Existing VM definition will be updated in oVirt (REST API)
 */
export function editVm (vm, actionUniqueId) {
  return {
    type: EDIT_VM,
    actionUniqueId,
    payload: {
      vm,
    },
  }
}

// --- Internal State -------------------------
export function loginSuccessful ({ token, username }) {
  return {
    type: LOGIN_SUCCESSFUL,
    payload: {
      token,
      username,
    },
  }
}

export function setOvirtApiVersion (oVirtApiVersion) {
  return {
    type: SET_OVIRT_API_VERSION,
    payload: {
      oVirtApiVersion,
    },
  }
}

export function logout () {
  return {
    type: LOGOUT,
    payload: {
    },
  }
}

export function clearUserMessages () {
  return {
    type: CLEAR_USER_MSGS,
    payload: {},
  }
}

export function loadInProgress ({ value }) {
  return {
    type: SET_LOAD_IN_PROGRESS,
    payload: {
      value,
    },
  }
}

/**
 * Update or Add
 * @param vms - array of vms
 * @returns {{type: string, payload: {vms: *}}}
 */
export function updateVms ({ vms, copySubResources = false }) {
  return {
    type: UPDATE_VMS,
    payload: {
      vms,
      copySubResources,
    },
  }
}

/**
 * Remove VMs from store.
 *
 * @param vmIds array
 * @returns {{type: string, payload: {vmIds: *}}}
 */
export function removeVms ({ vmIds }) {
  return {
    type: REMOVE_VMS,
    payload: {
      vmIds,
    },
  }
}

/**
 * Remove all VMs from store which ID is not listed among vmIdsToPreserve
 * @param vmIdsToPreserve
 * @returns {{type: string, payload: {vmIds: *}}}
 */
export function removeMissingVms ({ vmIdsToPreserve }) {
  return {
    type: REMOVE_MISSING_VMS,
    payload: {
      vmIdsToPreserve,
    },
  }
}

export function updateIcons ({ icons }) {
  return {
    type: UPDATE_ICONS,
    payload: {
      icons,
    },
  }
}

export function setVmDisks ({ vmId, disks }) {
  return {
    type: SET_VM_DISKS,
    payload: {
      vmId,
      disks,
    },
  }
}

export function vmActionInProgress ({ vmId, name, started }) {
  return {
    type: VM_ACTION_IN_PROGRESS,
    payload: {
      vmId,
      name,
      started,
    },
  }
}

export function setVmConsoles ({ vmId, consoles }) {
  return {
    type: SET_VM_CONSOLES,
    payload: {
      vmId,
      consoles,
    },
  }
}
