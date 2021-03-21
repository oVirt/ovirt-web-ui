import { takeEvery, put } from 'redux-saga/effects'

import Api from '_/ovirtapi'
import { callExternalAction, delay, delayInMsSteps } from '_/sagas/utils'
import { fetchVmSnapshots, startProgress, stopProgress } from '_/sagas'
import {
  addSnapshotRemovalPendingTask,
  removeSnapshotRemovalPendingTask,
  addSnapshotRestorePendingTask,
  removeSnapshotRestorePendingTask,
  addSnapshotAddPendingTask,
  removeSnapshotAddPendingTask,
  updateVmSnapshot,
} from '_/actions'

import { ADD_VM_SNAPSHOT, DELETE_VM_SNAPSHOT, RESTORE_VM_SNAPSHOT } from './constants'

function* addVmSnapshot (action) {
  yield put(addSnapshotAddPendingTask())
  const snapshot = yield callExternalAction('addNewSnapshot', Api.addNewSnapshot, action)

  if (snapshot && snapshot.id) {
    yield fetchVmSnapshots({ vmId: action.payload.vmId })
    for (let delayMilliSec of delayInMsSteps()) {
      const apiSnapshot = yield callExternalAction('snapshot', Api.snapshot, { payload: { snapshotId: snapshot.id, vmId: action.payload.vmId } }, true)
      if (apiSnapshot.snapshot_status !== 'locked') {
        break
      }
      yield delay(delayMilliSec)
    }
    yield fetchVmSnapshots({ vmId: action.payload.vmId })
  }
  yield put(removeSnapshotAddPendingTask())
}

function* deleteVmSnapshot (action) {
  const snapshotId = action.payload.snapshotId
  const vmId = action.payload.vmId
  const result = yield callExternalAction('deleteVmSnapshot', Api.deleteSnapshot, { payload: { snapshotId, vmId } })
  if (result.error) {
    return
  }
  yield put(addSnapshotRemovalPendingTask(snapshotId))
  let snapshotRemoved = false
  yield fetchVmSnapshots({ vmId })
  for (let delaySec of delayInMsSteps()) {
    const snapshot = yield callExternalAction('snapshot', Api.snapshot, { payload: { snapshotId, vmId } }, true)
    if (snapshot.error && snapshot.error.status === 404) {
      snapshotRemoved = true
      break
    } else {
      const snapshotInternal = Api.snapshotToInternal({ snapshot })
      yield put(updateVmSnapshot({ vmId, snapshot: snapshotInternal }))
    }
    yield delay(delaySec * 1000)
  }
  if (snapshotRemoved) {
    yield fetchVmSnapshots({ vmId })
  }
  yield put(removeSnapshotRemovalPendingTask(snapshotId))
}

function* restoreVmSnapshot (action) {
  yield put(addSnapshotRestorePendingTask())
  yield startProgress({ vmId: action.payload.vmId, name: 'restoreSnapshot' })
  const result = yield callExternalAction('restoreSnapshot', Api.restoreSnapshot, action)
  yield stopProgress({ vmId: action.payload.vmId, name: 'restoreSnapshot', result })
  yield put(removeSnapshotRestorePendingTask())
}

export default [
  takeEvery(ADD_VM_SNAPSHOT, addVmSnapshot),
  takeEvery(DELETE_VM_SNAPSHOT, deleteVmSnapshot),
  takeEvery(RESTORE_VM_SNAPSHOT, restoreVmSnapshot),
]
