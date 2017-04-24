export function toggleOptions () {
  return {
    type: 'TOGGLE_OPTIONS',
    payload: {
    },
  }
}

export function selectVmDetail ({ vmId }) {
  return {
    type: 'SELECT_VM_DETAIL',
    payload: {
      vmId,
    },
  }
}

export function setVmDetailToShow ({ vmId }) {
  return {
    type: 'SET_VM_DETAIL_TO_SHOW',
    payload: {
      vmId,
    },
  }
}

export function openAddVmDialog () {
  return {
    type: 'OPEN_ADD_VM_DIALOG',
    payload: {
    },
  }
}

export function openEditVmDialog ({ vmId }) {
  return {
    type: 'OPEN_EDIT_VM_DIALOG',
    payload: {
      vmId,
    },
  }
}

export function closeDialog () {
  return {
    type: 'CLOSE_DIALOG',
    payload: {
    },
  }
}
