import { SET_SAVED_VM, ADD_NEW_VM, EDIT_VM } from './constants'

export function setSavedVm ({ vm }) {
  return {
    type: SET_SAVED_VM,
    payload: {
      vm,
    },
  }
}

/**
 * New VM will be created in oVirt (REST API)
 */
export function createVm (vm, actionUniqueId, page) {
  return {
    type: ADD_NEW_VM,
    actionUniqueId,
    payload: {
      vm,
      page,
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
