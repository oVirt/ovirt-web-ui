import { DELETE_VM_SNAPSHOT } from './constants'

export function deleteVmSnapshot ({ vmId, snapshotId }) {
  return {
    type: DELETE_VM_SNAPSHOT,
    payload: {
      vmId,
      snapshotId,
    },
  }
}
