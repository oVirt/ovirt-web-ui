import { takeEvery, put } from 'redux-saga/effects'

import { REMOVE_DISK } from './constants'
import Api from 'ovirtapi'
import { callExternalAction, delay } from '../../saga/utils'
import { fetchDisks } from '../../sagas'
import { addDiskRemovalPendingTask, removeDiskRemovalPendingTask } from '../../actions'

function* removeDisk (action) {
  const diskId = action.payload.diskId
  const vmToRefreshId = action.payload.vmToRefreshId
  const result = yield callExternalAction('removeDisk', Api.removeDisk, { payload: diskId })
  if (result.error) {
    return
  }
  yield put(addDiskRemovalPendingTask({ diskId }))
  let diskRemoved = false
  for (let delaySec of [ 4, 4, 4, 60 ]) {
    const apiDisk = yield callExternalAction('disk', Api.disk, { type: 'GET_DISK_DETAILS', payload: { diskId } }, true)
    if (apiDisk.error && apiDisk.error.status === 404) {
      diskRemoved = true
      break
    }
    yield delay(delaySec * 1000)
  }
  if (diskRemoved && vmToRefreshId) {
    yield fetchDisks({ vms: [ { id: vmToRefreshId } ] })
  }
  yield put(removeDiskRemovalPendingTask(diskId))

  // todo drop polling in favor of events
  // see [Event driven refresh](https://github.com/oVirt/ovirt-web-ui/pull/390)
}

export default [
  takeEvery(REMOVE_DISK, removeDisk),
]
