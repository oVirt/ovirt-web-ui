import AppConfiguration from '_/config'
import {
  ADD_VM_NIC,
  CHANGE_VM_CDROM,
  COMPOSE_CREATE_VM,
  CREATE_VM,
  DELETE_VM_NIC,
  EDIT_VM_NIC,
  EDIT_VM,
  GET_RDP_VM,
  GET_VM,
  GET_VM_CDROM,
  GET_VMS,
  LOGIN_SUCCESSFUL,
  LOGIN,
  LOGOUT,
  NAVIGATE_TO_VM_DETAILS,
  NO_REFRESH_TYPE,
  REFRESH_DATA,
  REMOVE_MISSING_VMS,
  REMOVE_VM,
  REMOVE_VMS,
  RESTART_VM,
  SAVE_FILTERS,
  SET_CHANGED,
  SET_FILTERS,
  SET_OVIRT_API_VERSION,
  SET_VM_ACTION_RESULT,
  SET_VM_DISKS,
  SET_VM_NICS,
  SET_VM_SESSIONS,
  SET_VM_SNAPSHOTS,
  SET_VM_SORT,
  SHUTDOWN_VM,
  START_VM,
  SUSPEND_VM,
  UPDATE_ICONS,
  UPDATE_VM_DISK,
  UPDATE_VM_SNAPSHOT,
  UPDATE_VMS,
  VM_ACTION_IN_PROGRESS,
} from '_/constants'

export function login ({ username, domain, token, userId }) {
  return {
    type: LOGIN,
    payload: {
      username,
      domain,
      token,
      userId,
    },
  }
}

/**
 * I.e. the Refresh button is clicked or scheduler event occurred (polling)
 */
export function refresh ({
  pageRouterRefresh = false,
  schedulerRefresh = false,
  manualRefresh = false,
  targetPage = { type: NO_REFRESH_TYPE } }) {
  return {
    type: REFRESH_DATA,
    payload: {
      pageRouterRefresh,
      schedulerRefresh,
      manualRefresh,
      targetPage,
    },
  }
}

export function navigateToVmDetails (vmId) {
  return {
    type: NAVIGATE_TO_VM_DETAILS,
    payload: {
      vmId,
    },
  }
}

export function getSingleVm ({ vmId, shallowFetch = false }) {
  return {
    type: GET_VM,
    payload: {
      vmId,
      shallowFetch,
    },
  }
}

export function getVmsByPage ({ page, shallowFetch = true }) {
  return {
    type: GET_VMS,
    payload: {
      shallowFetch,
      page,
      count: AppConfiguration.pageLimit,
    },
  }
}

export function getVmsByCount ({ count, shallowFetch = true }) {
  return {
    type: GET_VMS,
    payload: {
      shallowFetch,
      page: 1,
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

export function suspendVm ({ vmId }) {
  return {
    type: SUSPEND_VM,
    payload: {
      vmId,
    },
  }
}

export function composeAndCreateVm ({ basic, nics, disks }, { correlationId, ...additionalMeta }) {
  return {
    type: COMPOSE_CREATE_VM,
    payload: {
      basic,
      nics,
      disks,
    },
    meta: {
      correlationId,
      ...additionalMeta,
    },
  }
}

export function createVm (
  { vm, cdrom, transformInput = true, pushToDetailsOnSuccess = false, clone = false, clonePermissions },
  { correlationId, ...additionalMeta }
) {
  return {
    type: CREATE_VM,
    payload: {
      vm,
      cdrom,
      transformInput,
      pushToDetailsOnSuccess,
      clone,
      clonePermissions,
    },
    meta: {
      correlationId,
      ...additionalMeta,
    },
  }
}

export function editVm (
  { vm, transformInput = true, restartAfterEdit = false, nextRun = false, changeCurrentCd = true },
  { correlationId, ...additionalMeta }
) {
  return {
    type: EDIT_VM,
    payload: {
      vm,
      transformInput,
      restartAfterEdit,
      nextRun,
      changeCurrentCd,
    },
    meta: {
      correlationId,
      ...additionalMeta,
    },
  }
}

export function removeVm ({ vmId, preserveDisks = false }) {
  return {
    type: REMOVE_VM,
    payload: {
      vmId,
      preserveDisks,
    },
  }
}

export function setVmActionResult ({ vmId, correlationId, result }) {
  return {
    type: SET_VM_ACTION_RESULT,
    payload: {
      vmId,
      correlationId,
      result,
    },
  }
}

// --- Internal State -------------------------
export function loginSuccessful ({ username, domain, token, userId }) {
  return {
    type: LOGIN_SUCCESSFUL,
    payload: {
      username,
      domain,
      token,
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

export function logout (isManual = false) {
  return {
    type: LOGOUT,
    payload: {
      isManual,
    },
  }
}

/**
 * Update or Add
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

export function updateVmDisk ({ vmId, disk }) {
  return {
    type: UPDATE_VM_DISK,
    payload: {
      vmId,
      disk,
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

export function getVmCdRom ({ vmId, current = true }) {
  return {
    type: GET_VM_CDROM,
    payload: {
      vmId,
      current,
    },
  }
}

export function changeVmCdRom ({ cdrom, vmId, current = true }, { correlationId, ...additionalMeta } = {}) {
  const action = {
    type: CHANGE_VM_CDROM,
    payload: {
      cdrom,
      vmId,
      current,
    },
  }

  if (correlationId) {
    action.meta = {
      correlationId,
      ...additionalMeta,
    }
  }

  return action
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

export function editVmNic ({ vmId, nic }) {
  return {
    type: EDIT_VM_NIC,
    payload: {
      vmId,
      nic,
    },
  }
}

export function updateVmSnapshot ({ vmId, snapshot }) {
  return {
    type: UPDATE_VM_SNAPSHOT,
    payload: {
      vmId,
      snapshot,
    },
  }
}

export function setVmsFilters ({ filters }) {
  return {
    type: SET_FILTERS,
    payload: {
      filters,
    },
  }
}

export function saveVmsFilters ({ filters }) {
  return {
    type: SAVE_FILTERS,
    payload: {
      filters,
    },
  }
}

export function setVmSort ({ sort }) {
  return {
    type: SET_VM_SORT,
    payload: {
      sort,
    },
  }
}
