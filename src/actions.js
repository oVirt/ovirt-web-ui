// --- External actions -----------------------
export function getVmIcons ({ vmId, smallIconId, largeIconId }) {
  return {
    type: 'GET_VM_ICONS',
    payload: {
      vmId,
      smallIconId,
      largeIconId
    }
  }
}

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
 * @param vm
 * @returns {{type: string, payload: {vm: *}}}
 */
export function updateVm ({ vm }) {
  return {
    type: 'UPDATE_VM',
    payload: {
      vm,
    },
  }
}

export function updateVmIcon ({ vmId, icon, type }) {
  return {
    type: 'UPDATE_VM_ICON',
    payload: {
      vmId,
      icon,
      type,
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
