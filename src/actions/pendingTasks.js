// @flow
/* eslint-disable flowtype/require-return-type */

import {
  ADD_DISK_REMOVAL_PENDING_TASK,
  ADD_SNAPSHOT_REMOVAL_PENDING_TASK,
  REMOVE_DISK_REMOVAL_PENDING_TASK,
  REMOVE_SNAPSHOT_REMOVAL_PENDING_TASK,
} from '../constants'

import { PendingTaskTypes } from '../reducers/pendingTasks'

export function addDiskRemovalPendingTask (diskId: string) {
  return {
    type: ADD_DISK_REMOVAL_PENDING_TASK,
    payload: {
      type: PendingTaskTypes.DISK_REMOVAL,
      started: new Date(),
      diskId,
    },
  }
}

export function removeDiskRemovalPendingTask (diskId: string) {
  return {
    type: REMOVE_DISK_REMOVAL_PENDING_TASK,
    payload: { diskId },
  }
}

export function addSnapshotRemovalPendingTask (snapshotId: string) {
  return {
    type: ADD_SNAPSHOT_REMOVAL_PENDING_TASK,
    payload: {
      type: PendingTaskTypes.SNAPSHOT_REMOVAL,
      started: new Date(),
      snapshotId,
    },
  }
}

export function removeSnapshotRemovalPendingTask (snapshotId: string) {
  return {
    type: REMOVE_SNAPSHOT_REMOVAL_PENDING_TASK,
    payload: { snapshotId },
  }
}
