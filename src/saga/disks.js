import { takeEvery, put } from 'redux-saga/effects'

import { CREATE_DISK_FOR_VM, REMOVE_DISK, EDIT_VM_DISK } from '../constants'
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
    yield waitForDiskToBeUnlocked(vmId, result.id)
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
  const diskRemoved = yield waitForDisk(
    vmToRefreshId,
    diskId,
    apiDisk => apiDisk.error && apiDisk.error.status === 404,
    true
  )
  yield put(removeDiskRemovalPendingTask(diskId))

  if (diskRemoved && vmToRefreshId) {
    yield fetchDisks({ vms: [ { id: vmToRefreshId } ] })
  }
}

function* editDiskOnVm (action) {
  const { disk, vmId } = action.payload

  // only allow editing name and provisionedSize
  const editableFieldsDisk = {
    attachmentId: disk.attachmentId,
    id: disk.id,
    name: disk.name,
    provisionedSize: disk.provisionedSize, // only for type === 'image'
  }

  action.payload.disk = editableFieldsDisk
  const result = yield callExternalAction('updateDiskAttachment', Api.updateDiskAttachment, action)
  if (result.error) {
    return
  }

  yield waitForDiskToBeUnlocked(vmId, disk.id)
  yield fetchDisks({ vms: [ { id: vmId } ] })
}

function* waitForDiskToBeUnlocked (vmId, diskId) {
  return yield waitForDisk(vmId, diskId, disk => disk.status && disk.status !== 'locked')
}

// TODO: drop polling in favor of events (see https://github.com/oVirt/ovirt-web-ui/pull/390)
function* waitForDisk (vmId, diskId, test, canBeMissing = false) {
  let metTest = false

  for (let i = 1; !metTest && i < 20; i++) {
    const apiDisk = yield callExternalAction('disk', Api.disk, { payload: { diskId } }, canBeMissing)
    const edited = Api.diskToInternal({ disk: apiDisk })
    if (vmId) {
      yield put(updateVmDisk({ vmId, disk: edited }))
    }

    if (test(apiDisk)) {
      metTest = true
    } else {
      yield delay(Math.log2(i) * 2000) // gradually wait a bit longer each time
    }
  }

  return metTest
}

export default [
  takeEvery(CREATE_DISK_FOR_VM, createDiskForVm),
  takeEvery(REMOVE_DISK, removeDisk),
  takeEvery(EDIT_VM_DISK, editDiskOnVm),
]
