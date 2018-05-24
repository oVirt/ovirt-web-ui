import { takeEvery, put } from 'redux-saga/effects'

import { DELETE_VM_SNAPSHOT } from './constants'
import Api from '../../ovirtapi'
import { callExternalAction, delay } from '../../saga/utils'
import { fetchVmSnapshots } from '../../sagas'
import { addSnapshotRemovalPendingTask, removeSnapshotRemovalPendingTask, setVmSnapshots } from '../../actions'

function* deleteVmSnapshot (action) {
  const snapshotId = action.payload.snapshotId
  const vmId = action.payload.vmId
  const result = yield callExternalAction('deleteVmSnapshot', Api.deleteVmSnapshot, { payload: { snapshotId, vmId } })
  if (result.error) {
    return
  }
  yield put(addSnapshotRemovalPendingTask(snapshotId))
  let snapshotRemoved = false
  for (let delaySec of [ 4, 4, 4, 30, 60 ]) {
    const apiSnapshot = yield callExternalAction('snapshot', Api.snapshot, { payload: { snapshotId, vmId } }, true)
    if (apiSnapshot.error && apiSnapshot.error.status === 404) {
      snapshotRemoved = true
      break
    }
    yield delay(delaySec * 1000)
  }
  if (snapshotRemoved) {
    const snapshots = yield fetchVmSnapshots({ vmId })
    yield put(setVmSnapshots({ vmId, snapshots }))
  }
  yield put(removeSnapshotRemovalPendingTask(snapshotId))
}

export default [
  takeEvery(DELETE_VM_SNAPSHOT, deleteVmSnapshot),
]
