// --- External actions -----------------------
export function getVmDisks ({ vmId }) {
  return {
    type: 'GET_VM_DISKS',
    payload: {
      vmId
    }
  }
}

// --- Internal State -------------------------
/**
 * Update or Add
 * @param vms - array of vms
 * @returns {{type: string, payload: {vms: *}}}
 */
export function updateVms ({ vms }) {
  return {
    type: 'UPDATE_VMS',
    payload: {
      vms,
    },
  }
}

export function getIcon ({ iconId }) {
  return {
    type: 'GET_VM_ICON',
    payload: {
      iconId,
    },
  }
}

export function updateIcon ({ icon }) {
  return {
    type: 'UPDATE_ICON',
    payload: {
      icon,
    },
  }
}

export function updateVmDisk ({ vmId, disk }) {
  return {
    type: 'UPDATE_VM_DISK',
    payload: {
      vmId,
      disk
    }
  }
}
