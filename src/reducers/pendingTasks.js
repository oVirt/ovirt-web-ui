/*
 * This store subtree keeps track of async actions that were requsted on engine but haven't be confirmed
 * successful/failed yet.
 *
 * Each task is of type { type: string, started: Date }. Other properties depends on the type.
 *
 * This would by nice to be cleaned by events polling.
 */

import { fromJS } from 'immutable'

import { actionReducer } from './utils'
import {
  ADD_DISK_REMOVAL_PENDING_TASK,
  ADD_SNAPSHOT_REMOVAL_PENDING_TASK,
  ADD_SNAPSHOT_RESTORE_PENDING_TASK,
  ADD_SNAPSHOT_ADD_PENDING_TASK,
  REMOVE_DISK_REMOVAL_PENDING_TASK,
  REMOVE_SNAPSHOT_REMOVAL_PENDING_TASK,
  REMOVE_SNAPSHOT_RESTORE_PENDING_TASK,
  REMOVE_SNAPSHOT_ADD_PENDING_TASK,
} from '_/constants'

export const PendingTaskTypes = {
  DISK_REMOVAL: 'DISK_REMOVAL',
  SNAPSHOT_REMOVAL: 'SNAPSHOT_REMOVAL',
  SNAPSHOT_RESTORE: 'SNAPSHOT_RESTORE',
  SNAPSHOT_ADD: 'SNAPSHOT_ADD',
}

const initialState = fromJS([])

export default actionReducer(initialState, {
  [ADD_DISK_REMOVAL_PENDING_TASK] (pendingTasks, { payload: { diskId } }) {
    const existingTask = pendingTasks.find(
      task => task.type === PendingTaskTypes.DISK_REMOVAL && task.diskId === diskId
    )
    if (existingTask) {
      return pendingTasks
    }
    return pendingTasks.push({
      type: PendingTaskTypes.DISK_REMOVAL,
      started: new Date(),
      diskId,
    })
  },
  [REMOVE_DISK_REMOVAL_PENDING_TASK] (pendingTasks, { payload: { diskId } }) {
    const index = pendingTasks.findKey(
      task => task.type === PendingTaskTypes.DISK_REMOVAL && task.diskId === diskId
    )
    return pendingTasks.delete(index)
  },

  [ADD_SNAPSHOT_REMOVAL_PENDING_TASK] (pendingTasks, { payload }) {
    const existingTask = pendingTasks.find(task =>
      task.type === PendingTaskTypes.SNAPSHOT_REMOVAL && task.snapshotId === payload)
    if (existingTask) {
      return pendingTasks
    }
    return pendingTasks.push(payload)
  },
  [REMOVE_SNAPSHOT_REMOVAL_PENDING_TASK] (pendingTasks, { payload }) {
    const index = pendingTasks.findKey(
      task => task.type === PendingTaskTypes.SNAPSHOT_REMOVAL && task.snapshotId === payload.snapshotId)
    return pendingTasks.delete(index)
  },
  [ADD_SNAPSHOT_RESTORE_PENDING_TASK] (pendingTasks, { payload }) {
    const existingTask = pendingTasks.find(task =>
      task.type === PendingTaskTypes.SNAPSHOT_RESTORE)
    if (existingTask) {
      return pendingTasks
    }
    return pendingTasks.push(payload)
  },
  [REMOVE_SNAPSHOT_RESTORE_PENDING_TASK] (pendingTasks, { payload }) {
    const index = pendingTasks.findKey(
      task => task.type === PendingTaskTypes.SNAPSHOT_RESTORE)
    return pendingTasks.delete(index)
  },
  [ADD_SNAPSHOT_ADD_PENDING_TASK] (pendingTasks, { payload }) {
    const existingTask = pendingTasks.find(task =>
      task.type === PendingTaskTypes.SNAPSHOT_ADD)
    if (existingTask) {
      return pendingTasks
    }
    return pendingTasks.push(payload)
  },
  [REMOVE_SNAPSHOT_ADD_PENDING_TASK] (pendingTasks, { payload }) {
    const index = pendingTasks.findKey(
      task => task.type === PendingTaskTypes.SNAPSHOT_ADD)
    return pendingTasks.delete(index)
  },
})
