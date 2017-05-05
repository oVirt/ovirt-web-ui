import {
  SELECT_POOL_DETAIL,
  SET_POOL_DETAIL_TO_SHOW,
} from '../constants/index'

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

export function selectPoolDetail ({ poolId }) {
  return {
    type: SELECT_POOL_DETAIL,
    payload: {
      poolId,
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

export function closeDialog ({ force = false }) {
  return {
    type: 'CLOSE_DIALOG',
    payload: {
      force,
    },
  }
}

export function setPoolDetailToShow ({ poolId }) {
  return {
    type: SET_POOL_DETAIL_TO_SHOW,
    payload: {
      poolId,
    },
  }
}

export function requestCloseDialogConfirmation () {
  return {
    type: 'REQUEST_CLOSE_DIALOG_CONFIRMATION',
    payload: {
    },
  }
}
