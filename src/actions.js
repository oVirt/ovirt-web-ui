// --- External actions -----------------------
export function getVmDisks ({ vmId }) {
  return {
    type: 'GET_VM_DISKS',
    payload: {
      vmId
    }
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

// --- Internal State -------------------------
