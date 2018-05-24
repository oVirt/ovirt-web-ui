import { ADD_VM_SNAPSHOT, DELETE_VM_SNAPSHOT } from './constants'

export function deleteVmSnapshot ({ vmId, snapshotId }) {
  return {
    type: DELETE_VM_SNAPSHOT,
    payload: {
      vmId,
      snapshotId,
    },
  }
}

export function addVmSnapshot ({ vmId, snapshot }) {
  return {
    type: ADD_VM_SNAPSHOT,
    payload: {
      vmId,
      snapshot,
    },
  }
}
