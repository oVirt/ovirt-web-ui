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

import { PendingTaskTypes } from '_/reducers/pendingTasks'

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

export function addSnapshotRemovalPendingTask (snapshotId: string): any {
  return {
    type: ADD_SNAPSHOT_REMOVAL_PENDING_TASK,
    payload: {
      type: PendingTaskTypes.SNAPSHOT_REMOVAL,
      started: new Date(),
      snapshotId,
    },
  }
}

export function removeSnapshotRemovalPendingTask (snapshotId: string): any {
  return {
    type: REMOVE_SNAPSHOT_REMOVAL_PENDING_TASK,
    payload: { snapshotId },
  }
}

export function addSnapshotRestorePendingTask (): any {
  return {
    type: ADD_SNAPSHOT_RESTORE_PENDING_TASK,
    payload: {
      type: PendingTaskTypes.SNAPSHOT_RESTORE,
      started: new Date(),
    },
  }
}

export function removeSnapshotRestorePendingTask (): any {
  return { type: REMOVE_SNAPSHOT_RESTORE_PENDING_TASK }
}

export function addSnapshotAddPendingTask (): any {
  return {
    type: ADD_SNAPSHOT_ADD_PENDING_TASK,
    payload: {
      type: PendingTaskTypes.SNAPSHOT_ADD,
      started: new Date(),
    },
  }
}

export function removeSnapshotAddPendingTask (): any {
  return { type: REMOVE_SNAPSHOT_ADD_PENDING_TASK }
}
