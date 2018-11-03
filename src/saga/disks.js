import { takeEvery, put } from 'redux-saga/effects'

import { CREATE_DISK_FOR_VM, REMOVE_DISK } from '../constants'
import Api from 'ovirtapi'
import { callExternalAction, delay } from './utils'
import { fetchDisks } from '../sagas'

import {
  addDiskRemovalPendingTask,
  removeDiskRemovalPendingTask,
  extractErrorText,
  updateVmDisk,
} from '../actions'
import {
  setNewDiskDialogProgressIndicator,
  setNewDiskDialogErrorText,
  setNewDiskDialogDone,
} from '../components/NewDiskDialog/actions'

function* createDiskForVm (action) {
  yield put(setNewDiskDialogProgressIndicator(true))
  const vmId = action.payload.vmId

  const result = yield callExternalAction('addDiskAttachment', Api.addDiskAttachment, action)
  if (result.error) {
    const errorText = extractErrorText(result.error)
    yield put(setNewDiskDialogErrorText(errorText))
  } else {
    yield fetchDisks({ vms: [ { id: vmId } ] })
    yield waitForDiskAttachment(
      vmId,
      result.id,
      attachment => attachment.disk && attachment.disk.status && attachment.disk.status !== 'locked'
    )
    yield put(setNewDiskDialogDone())
  }
  yield put(setNewDiskDialogProgressIndicator(false))
}

function* removeDisk (action) {
  const diskId = action.payload.diskId
  const vmToRefreshId = action.payload.vmToRefreshId

  const result = yield callExternalAction('removeDisk', Api.removeDisk, { payload: diskId })
  if (result.error) {
    return
  }

  yield put(addDiskRemovalPendingTask(diskId))
  const diskRemoved = yield waitForDiskAttachment(
    vmToRefreshId,
    diskId,
    attachment => attachment.error && attachment.error.status === 404,
    true
  )
  yield put(removeDiskRemovalPendingTask(diskId))

  if (diskRemoved && vmToRefreshId) {
    yield fetchDisks({ vms: [ { id: vmToRefreshId } ] })
  }
}

// TODO: drop polling in favor of events (see https://github.com/oVirt/ovirt-web-ui/pull/390)
function* waitForDiskAttachment (vmId, attachmentId, test, canBeMissing = false) {
  let metTest = false

  for (let i = 1; !metTest && i < 20; i++) {
    const apiDiskAttachment = yield callExternalAction(
      'diskattachment',
      Api.diskattachment,
      { payload: { vmId, attachmentId } },
      canBeMissing
    )

    if (!apiDiskAttachment.error) {
      const apiDisk = apiDiskAttachment.disk
      const edited = Api.diskToInternal({ attachment: apiDiskAttachment, disk: apiDisk })
      if (vmId) {
        yield put(updateVmDisk({ vmId, disk: edited }))
      }
    }

    if (test(apiDiskAttachment)) {
      metTest = true
    } else {
      const delayMs = Math.log2(i + 1) * 2000
      yield delay(delayMs) // gradually wait a bit longer each time
    }
  }

  return metTest
}

export default [
  takeEvery(CREATE_DISK_FOR_VM, createDiskForVm),
  takeEvery(REMOVE_DISK, removeDisk),
]
