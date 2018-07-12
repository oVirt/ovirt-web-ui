import {
  ADD_VM_NIC,
  DELETE_VM_NIC,
  DOWNLOAD_CONSOLE_VM,
  GET_RDP_VM,
  GET_VMS_BY_COUNT,
  GET_VMS_BY_PAGE,
  LOGIN_SUCCESSFUL,
  LOGIN,
  LOGOUT,
  REFRESH_DATA,
  REMOVE_MISSING_VMS,
  REMOVE_VM,
  REMOVE_VMS,
  RESTART_VM,
  SET_CHANGED,
  SET_DOMAIN,
  SET_OVIRT_API_VERSION,
  SET_VM_CDROM,
  SET_VM_CONSOLES,
  SET_VM_DISKS,
  SET_VM_NICS,
  SET_VM_SESSIONS,
  SET_VM_SNAPSHOTS,
  SHUTDOWN_VM,
  START_VM,
  SUSPEND_VM,
  UPDATE_ICONS,
  UPDATE_VMS,
  VM_ACTION_IN_PROGRESS,
} from '../constants'

export function login ({ username, password, token, userId }) {
  return {
    type: LOGIN,
    payload: {
      credentials: {
        username,
        password,
      },
      token,
      userId,
    },
  }
}

export function setDomain ({ domain }) {
  return {
    type: SET_DOMAIN,
    payload: {
      domain,
    },
  }
}

/**
 * I.e. the Refresh button is clicked or scheduler event occurred (polling)
 */
export function refresh ({ page, quiet = false, shallowFetch = false }) {
  return {
    type: REFRESH_DATA,
    payload: {
      quiet,
      shallowFetch,
      page,
    },
  }
}

export function getVmsByPage ({ page, shallowFetch = true }) {
  return {
    type: GET_VMS_BY_PAGE,
    payload: {
      shallowFetch,
      page,
    },
  }
}

export function getVmsByCount ({ count, shallowFetch = true }) {
  return {
    type: GET_VMS_BY_COUNT,
    payload: {
      shallowFetch,
      count,
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

export function downloadConsole ({ vmId, consoleId, usbFilter }) {
  return {
    type: DOWNLOAD_CONSOLE_VM,
    payload: {
      vmId,
      consoleId,
      usbFilter,
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

export function removeVm ({ vmId, force = false, preserveDisks = false }) {
  return {
    type: REMOVE_VM,
    payload: {
      vmId,
      force,
      preserveDisks,
    },
  }
}

// --- Internal State -------------------------
export function loginSuccessful ({ token, username, userId }) {
  return {
    type: LOGIN_SUCCESSFUL,
    payload: {
      token,
      username,
      userId,
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

/**
 * Update or Add
 * @param vms - array of vms
 * @returns {{type: string, payload: {vms: *}}}
 */
export function updateVms ({ vms, copySubResources = false, page = null }) {
  return {
    type: UPDATE_VMS,
    payload: {
      vms,
      copySubResources,
      page,
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

export function setVmSessions ({ vmId, sessions }) {
  return {
    type: SET_VM_SESSIONS,
    payload: {
      vmId,
      sessions,
    },
  }
}

export function setVmSnapshots ({ vmId, snapshots }) {
  return {
    type: SET_VM_SNAPSHOTS,
    payload: {
      vmId,
      snapshots,
    },
  }
}

export function getRDP ({ vmName, username, domain, fqdn }) {
  return {
    type: GET_RDP_VM,
    payload: {
      vmName,
      username,
      domain,
      fqdn,
    },
  }
}

export function setChanged ({ value }) {
  return {
    type: SET_CHANGED,
    payload: {
      value,
    },
  }
}

export function setVmCDRom ({ cdrom, vmId }) {
  return {
    type: SET_VM_CDROM,
    payload: {
      cdrom,
      vmId,
    },
  }
}

export function setVmNics ({ vmId, nics }) {
  return {
    type: SET_VM_NICS,
    payload: {
      vmId,
      nics,
    },
  }
}

export function addVmNic ({ vmId, nic }) {
  return {
    type: ADD_VM_NIC,
    payload: {
      vmId,
      nic,
    },
  }
}

export function deleteVmNic ({ vmId, nicId }) {
  return {
    type: DELETE_VM_NIC,
    payload: {
      vmId,
      nicId,
    },
  }
}
