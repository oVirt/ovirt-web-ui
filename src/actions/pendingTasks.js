// @flow
/* eslint-disable flowtype/require-return-type */

import {
  ADD_DISK_REMOVAL_PENDING_TASK,
  REMOVE_DISK_REMOVAL_PENDING_TASK,
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
