// @flow

import {
  ADD_DISK_REMOVAL_PENDING_TASK,
  ADD_SNAPSHOT_ADD_PENDING_TASK,
  ADD_SNAPSHOT_REMOVAL_PENDING_TASK,
  ADD_SNAPSHOT_RESTORE_PENDING_TASK,
  REMOVE_DISK_REMOVAL_PENDING_TASK,
  REMOVE_SNAPSHOT_ADD_PENDING_TASK,
  REMOVE_SNAPSHOT_REMOVAL_PENDING_TASK,
  REMOVE_SNAPSHOT_RESTORE_PENDING_TASK,
} from '_/constants'

export function addDiskRemovalPendingTask (diskId: string): any {
  return {
    type: ADD_DISK_REMOVAL_PENDING_TASK,
    payload: {
      diskId,
    },
  }
}

export function removeDiskRemovalPendingTask (diskId: string): any {
  return {
    type: REMOVE_DISK_REMOVAL_PENDING_TASK,
    payload: {
      diskId,
    },
  }
}

export function addSnapshotRemovalPendingTask (vmId: string, snapshotId: string): any {
  return {
    type: ADD_SNAPSHOT_REMOVAL_PENDING_TASK,
    payload: {
      vmId,
      snapshotId,
    },
  }
}

export function removeSnapshotRemovalPendingTask (vmId: string, snapshotId: string): any {
  return {
    type: REMOVE_SNAPSHOT_REMOVAL_PENDING_TASK,
    payload: {
      vmId,
      snapshotId,
    },
  }
}

export function addSnapshotRestorePendingTask (vmId: string, snapshotId: string): any {
  return {
    type: ADD_SNAPSHOT_RESTORE_PENDING_TASK,
    payload: {
      vmId,
      snapshotId,
    },
  }
}

export function removeSnapshotRestorePendingTask (vmId: string, snapshotId: string): any {
  return {
    type: REMOVE_SNAPSHOT_RESTORE_PENDING_TASK,
    payload: {
      vmId,
      snapshotId,
    },
  }
}

export function addSnapshotAddPendingTask (vmId: string): any {
  return {
    type: ADD_SNAPSHOT_ADD_PENDING_TASK,
    payload: {
      vmId,
    },
  }
}

export function removeSnapshotAddPendingTask (vmId: string): any {
  return {
    type: REMOVE_SNAPSHOT_ADD_PENDING_TASK,
    payload: {
      vmId,
    },
  }
}
