import { takeEvery, put, select } from 'redux-saga/effects'

import { CREATE_DISK_FOR_VM, REMOVE_DISK, EDIT_VM_DISK } from '../constants'
import Api from '../ovirtapi'
import { callExternalAction, delay, delayInMsSteps } from './utils'
import { fetchDisks } from './index'

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

export function* createDiskForVm (action) {
  yield put(setNewDiskDialogProgressIndicator(true))
  const vmId = action.payload.vmId

  let originalBootableDisk
  if (action.payload.disk.bootable) {
    originalBootableDisk = yield clearBootableFlagOnVm(vmId)
  }

  const result = yield callExternalAction('addDiskAttachment', Api.addDiskAttachment, action)
  if (result.error) {
    if (originalBootableDisk) {
      yield updateDiskAttachmentBootable(vmId, originalBootableDisk, true)
    }
    const errorText = extractErrorText(result.error)
    yield put(setNewDiskDialogErrorText(errorText))
  } else {
    yield fetchDisks({ vms: [{ id: vmId }] })
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
  const diskRemoved = yield waitForDiskToBeRemoved(vmToRefreshId, diskId)
  yield put(removeDiskRemovalPendingTask(diskId))

  if (diskRemoved && vmToRefreshId) {
    yield fetchDisks({ vms: [{ id: vmToRefreshId }] })
  }
}

function* editDiskOnVm (action) {
  const { disk, vmId } = action.payload
  // only allow editing name, provisionedSize and bootable
  const editableFieldsDisk = {
    attachmentId: disk.attachmentId,
    id: disk.id,
    name: disk.name,
    provisionedSize: disk.provisionedSize, // only for type === 'image'
    bootable: disk.bootable,
  }

  yield clearBootableFlagOnVm(vmId, disk)

  action.payload.disk = editableFieldsDisk
  const result = yield callExternalAction('updateDiskAttachment', Api.updateDiskAttachment, action)
  if (result.error) {
    return
  }

  yield waitForDiskToBeUnlocked(vmId, disk.id)
  yield fetchDisks({ vms: [{ id: vmId }] })
}

function* clearBootableFlagOnVm (vmId, currentDisk) {
  const vmDisks = yield select(state => state.vms.getIn(['vms', vmId, 'disks']))
  const bootableDisk = vmDisks.find(disk => disk.get('bootable'))

  if (bootableDisk && (!currentDisk || bootableDisk.get('id') !== currentDisk.id)) {
    yield updateDiskAttachmentBootable(vmId, bootableDisk.get('id'), false)
    return bootableDisk.get('id')
  }
}

/**
 * Update the given VM's disk attachment bootable flag and wait for the value to be
 * changed (async only operation + poll until desired result = simulated sync operation)
 */
function* updateDiskAttachmentBootable (vmId, diskAttachmentId, isBootable) {
  const result = yield callExternalAction('updateDiskAttachment', Api.updateDiskAttachment, {
    payload: {
      disk: { attachmentId: diskAttachmentId, bootable: isBootable },
      vmId,
      attachmentOnly: true,
    },
  })

  if (result.error) {
    console.error('Problem removing the bootable flag :shrug:', result.error)
  } else {
    yield waitForDiskToMatchBootable(vmId, diskAttachmentId, isBootable)
  }
}

function* waitForDiskToBeRemoved (vmId, attachmentId) {
  return yield waitForDiskAttachment(
    vmId,
    attachmentId,
    attachment => attachment.error && attachment.error.status === 404,
    true
  )
}

function* waitForDiskToMatchBootable (vmId, attachmentId, isBootable) {
  return yield waitForDiskAttachment(
    vmId,
    attachmentId,
    attachment => attachment.bootable === (isBootable ? 'true' : 'false'),
    true
  )
}

function* waitForDiskToBeUnlocked (vmId, attachmentId) {
  return yield waitForDiskAttachment(
    vmId,
    attachmentId,
    attachment => attachment.disk && attachment.disk.status && attachment.disk.status !== 'locked',
  )
}

// NOTE: test() is given the untransformed API version of the attachment
function* waitForDiskAttachment (vmId, attachmentId, test, canBeMissing = false) {
  let metTest = false

  for (let delayMs of delayInMsSteps()) {
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
      break
    } else {
      yield delay(delayMs)
    }
  }

  return metTest
}

export default [
  takeEvery(CREATE_DISK_FOR_VM, createDiskForVm),
  takeEvery(REMOVE_DISK, removeDisk),
  takeEvery(EDIT_VM_DISK, editDiskOnVm),
]
