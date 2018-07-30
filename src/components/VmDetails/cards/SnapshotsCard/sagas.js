import { takeEvery, put } from 'redux-saga/effects'

import { ADD_VM_SNAPSHOT, DELETE_VM_SNAPSHOT, RESTORE_VM_SNAPSHOT } from './constants'
import Api from 'ovirtapi'
import { callExternalAction, delay } from '../../../../saga/utils'
import { fetchVmSnapshots, startProgress, stopProgress } from '../../../../sagas'
import { addSnapshotRemovalPendingTask, removeSnapshotRemovalPendingTask } from '../../../../actions'

function* addVmSnapshot (action) {
  const snapshot = yield callExternalAction('addNewSnapshot', Api.addNewSnapshot, action)

  if (snapshot && snapshot.id) {
    yield fetchVmSnapshots({ vmId: action.payload.vmId })
  }
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
  for (let delaySec of [ 4, 4, 4, 30, 30, 60 ]) {
    const apiSnapshot = yield callExternalAction('snapshot', Api.snapshot, { payload: { snapshotId, vmId } }, true)
    if (apiSnapshot.error && apiSnapshot.error.status === 404) {
      snapshotRemoved = true
      break
    }
    yield delay(delaySec * 1000)
  }
  if (snapshotRemoved) {
    yield fetchVmSnapshots({ vmId })
  }
  yield put(removeSnapshotRemovalPendingTask(snapshotId))
}

function* restoreVmSnapshot (action) {
  yield startProgress({ vmId: action.payload.vmId, name: 'restoreSnapshot' })
  const result = yield callExternalAction('restoreSnapshot', Api.restoreSnapshot, action)
  yield stopProgress({ vmId: action.payload.vmId, name: 'restoreSnapshot', result })
}

export default [
  takeEvery(ADD_VM_SNAPSHOT, addVmSnapshot),
  takeEvery(DELETE_VM_SNAPSHOT, deleteVmSnapshot),
  takeEvery(RESTORE_VM_SNAPSHOT, restoreVmSnapshot),
]
