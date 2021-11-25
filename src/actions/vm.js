import AppConfiguration from '_/config'
import * as C from '_/constants'

export function login ({ username, domain, token, userId, sessionAgeInSecAtPageLoad }) {
  return {
    type: C.LOGIN,
    payload: {
      username,
      domain,
      token,
      userId,
      sessionAgeInSecAtPageLoad,
    },
  }
}

export function navigateToVmDetails (vmId) {
  return {
    type: C.NAVIGATE_TO_VM_DETAILS,
    payload: {
      vmId,
    },
  }
}

export function getSingleVm ({ vmId, shallowFetch = false }) {
  return {
    type: C.GET_VM,
    payload: {
      vmId,
      shallowFetch,
    },
  }
}

export function getVmsByPage ({ page, shallowFetch = true }) {
  return {
    type: C.GET_VMS,
    payload: {
      shallowFetch,
      page,
      count: AppConfiguration.pageLimit,
    },
  }
}

export function getVmsByCount ({ count, shallowFetch = true }) {
  return {
    type: C.GET_VMS,
    payload: {
      shallowFetch,
      page: 1,
      count,
    },
  }
}

export function shutdownVm ({ vmId, force = false }) {
  return {
    type: C.SHUTDOWN_VM,
    payload: {
      vmId,
      force,
    },
  }
}

export function restartVm ({ vmId, force = false }) {
  return {
    type: C.RESTART_VM,
    payload: {
      vmId,
      force,
    },
  }
}

export function startVm ({ vmId }) {
  return {
    type: C.START_VM,
    payload: {
      vmId,
    },
  }
}

export function suspendVm ({ vmId }) {
  return {
    type: C.SUSPEND_VM,
    payload: {
      vmId,
    },
  }
}

export function composeAndCreateVm ({ basic, nics, disks }, { correlationId, ...additionalMeta }) {
  return {
    type: C.COMPOSE_CREATE_VM,
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
    type: C.CREATE_VM,
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
    type: C.EDIT_VM,
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
    type: C.REMOVE_VM,
    payload: {
      vmId,
      preserveDisks,
    },
  }
}

export function setVmActionResult ({ vmId, correlationId, result }) {
  return {
    type: C.SET_VM_ACTION_RESULT,
    payload: {
      vmId,
      correlationId,
      result,
    },
  }
}

// --- Internal State -------------------------
export function loginSuccessful ({ username, domain, token, userId, firstLogin }) {
  return {
    type: C.LOGIN_SUCCESSFUL,
    payload: {
      username,
      domain,
      token,
      userId,
      firstLogin,
    },
  }
}

export function setOvirtApiVersion (oVirtApiVersion) {
  return {
    type: C.SET_OVIRT_API_VERSION,
    payload: {
      oVirtApiVersion,
    },
  }
}

export function logout (isManual = false) {
  return {
    type: C.LOGOUT,
    payload: {
      isManual,
    },
  }
}

/**
 * Add, update, remove VMs, Pools and paging data.
 */
export function updateVms ({
  keepSubResources = false,
  vms,
  vmsPage,
  removeVmIds,
  pools,
  poolsPage,
  removePoolIds,
}) {
  return {
    type: C.UPDATE_VMS,
    payload: {
      keepSubResources,
      vms,
      vmsPage,
      removeVmIds,
      pools,
      poolsPage,
      removePoolIds,
    },
  }
}

export function updateIcons ({ icons }) {
  return {
    type: C.UPDATE_ICONS,
    payload: {
      icons,
    },
  }
}

export function setVmDisks ({ vmId, disks }) {
  return {
    type: C.SET_VM_DISKS,
    payload: {
      vmId,
      disks,
    },
  }
}

export function updateVmDisk ({ vmId, disk }) {
  return {
    type: C.UPDATE_VM_DISK,
    payload: {
      vmId,
      disk,
    },
  }
}

export function startActionInProgress ({ vmId, poolId, name }) {
  return {
    type: C.ACTION_IN_PROGRESS_START,
    payload: {
      vmId,
      poolId,
      name,
    },
  }
}

export function stopActionInProgress ({ vmId, poolId, name, result }) {
  return {
    type: C.ACTION_IN_PROGRESS_STOP,
    payload: {
      vmId,
      poolId,
      name,
      result,
    },
  }
}

export function vmActionInProgress ({ vmId, name, started }) {
  return {
    type: C.VM_ACTION_IN_PROGRESS,
    payload: {
      vmId,
      name,
      started,
    },
  }
}

export function setVmSessions ({ vmId, sessions }) {
  return {
    type: C.SET_VM_SESSIONS,
    payload: {
      vmId,
      sessions,
    },
  }
}

export function setVmSnapshots ({ vmId, snapshots }) {
  return {
    type: C.SET_VM_SNAPSHOTS,
    payload: {
      vmId,
      snapshots,
    },
  }
}

export function setChanged ({ value }) {
  return {
    type: C.SET_CHANGED,
    payload: {
      value,
    },
  }
}

export function getVmCdRom ({ vmId, current = true }) {
  return {
    type: C.GET_VM_CDROM,
    payload: {
      vmId,
      current,
    },
  }
}

export function changeVmCdRom ({ cdrom, vmId, current = true }, { correlationId, ...additionalMeta } = {}) {
  const action = {
    type: C.CHANGE_VM_CDROM,
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
    type: C.SET_VM_NICS,
    payload: {
      vmId,
      nics,
    },
  }
}

export function addVmNic ({ vmId, nic }) {
  return {
    type: C.ADD_VM_NIC,
    payload: {
      vmId,
      nic,
    },
  }
}

export function deleteVmNic ({ vmId, nicId }) {
  return {
    type: C.DELETE_VM_NIC,
    payload: {
      vmId,
      nicId,
    },
  }
}

export function editVmNic ({ vmId, nic }) {
  return {
    type: C.EDIT_VM_NIC,
    payload: {
      vmId,
      nic,
    },
  }
}

export function updateVmSnapshot ({ vmId, snapshot }) {
  return {
    type: C.UPDATE_VM_SNAPSHOT,
    payload: {
      vmId,
      snapshot,
    },
  }
}

export function setVmsFilters ({ filters }) {
  return {
    type: C.SET_FILTERS,
    payload: {
      filters,
    },
  }
}

export function saveVmsFilters ({ filters }) {
  return {
    type: C.SAVE_FILTERS,
    payload: {
      filters,
    },
  }
}

export function setVmSort ({ sort }) {
  return {
    type: C.SET_VM_SORT,
    payload: {
      sort,
    },
  }
}
