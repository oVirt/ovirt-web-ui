import { takeEvery, put, select } from 'redux-saga/effects'

import Api, { Transforms } from '_/ovirtapi'
import { callExternalAction, delay, delayInMsSteps } from '_/sagas/utils'
import { fetchVmSnapshots } from '_/sagas'
import {
  addSnapshotRemovalPendingTask,
  removeSnapshotRemovalPendingTask,
  addSnapshotRestorePendingTask,
  removeSnapshotRestorePendingTask,
  addSnapshotAddPendingTask,
  removeSnapshotAddPendingTask,
  updateVmSnapshot,
  startActionInProgress,
  stopActionInProgress,
  addUserMessage,
} from '_/actions'

import { ADD_VM_SNAPSHOT, DELETE_VM_SNAPSHOT, RESTORE_VM_SNAPSHOT } from './constants'
import { toJS } from '_/helpers'

function* addVmSnapshot (action) {
  const { vmId } = action.payload
  yield put(addSnapshotAddPendingTask(vmId))

  const snapshot = yield callExternalAction(Api.addNewSnapshot, action)
  if (snapshot?.id) {
    yield fetchVmSnapshots({ vmId })
    for (const delayMilliSec of delayInMsSteps()) {
      const apiSnapshot = yield callExternalAction(Api.snapshot, { payload: { snapshotId: snapshot.id, vmId: action.payload.vmId } }, true)
      if (apiSnapshot.snapshot_status !== 'locked') {
        break
      }
      yield delay(delayMilliSec)
    }
    yield fetchVmSnapshots({ vmId })
  }

  yield put(removeSnapshotAddPendingTask(vmId))
}

function* deleteVmSnapshot (action) {
  const { vmId, snapshotId } = action.payload
  yield put(addSnapshotRemovalPendingTask(vmId, snapshotId))

  const result = yield callExternalAction(Api.deleteSnapshot, { payload: { snapshotId, vmId } })
  if (result.error) {
    yield put(removeSnapshotRemovalPendingTask(vmId, snapshotId))
    return
  }

  let snapshotRemoved = false
  yield fetchVmSnapshots({ vmId })
  for (const delayMsSec of delayInMsSteps()) {
    const snapshot = yield callExternalAction(Api.snapshot, { payload: { snapshotId, vmId } }, true)
    if (snapshot.error && snapshot.error.status === 404) {
      snapshotRemoved = true
      break
    } else {
      const snapshotInternal = Transforms.Snapshot.toInternal({ snapshot })
      yield put(updateVmSnapshot({ vmId, snapshot: snapshotInternal }))
    }
    yield delay(delayMsSec)
  }
  if (snapshotRemoved) {
    yield fetchVmSnapshots({ vmId })
  }
  yield put(removeSnapshotRemovalPendingTask(vmId, snapshotId))
}

function* restoreVmSnapshot (action) {
  const { vmId, snapshotId } = action.payload
  const [snapshot = {}, vmName] = yield select(({ vms }) => [
    toJS(vms.getIn(['vms', vmId, 'snapshots'], [])).find(({ id }) => id === snapshotId),
    vms.getIn(['vms', vmId, 'name']),
  ])
  const { description: snapshotName = '' } = snapshot

  yield put(addSnapshotRestorePendingTask(vmId, snapshotId))
  yield put(startActionInProgress({ vmId, name: 'restoreSnapshot' }))
  // snapshot will be unlocked on the next refresh together with the VM
  yield put(updateVmSnapshot({ vmId, snapshot: { ...snapshot, status: 'locked' } }))

  const result = yield callExternalAction(Api.restoreSnapshot, action)

  yield put(stopActionInProgress({ vmId, name: 'restoreSnapshot', result }))
  yield put(removeSnapshotRestorePendingTask(vmId, snapshotId))
  if (!result.error) {
    // restore is synchronous operation so we can interpret completed operation as success
    yield put(addUserMessage({ messageDescriptor: { id: 'restoredSnapshot', params: { snapshotName, vmName } }, type: 'SUCCESS' }))
  }
}

export default [
  takeEvery(ADD_VM_SNAPSHOT, addVmSnapshot),
  takeEvery(DELETE_VM_SNAPSHOT, deleteVmSnapshot),
  takeEvery(RESTORE_VM_SNAPSHOT, restoreVmSnapshot),
]
