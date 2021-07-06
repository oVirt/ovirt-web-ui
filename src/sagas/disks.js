import { takeEvery, put, select } from 'redux-saga/effects'

import Api, { Transforms } from '_/ovirtapi'
import { CREATE_DISK_FOR_VM, REMOVE_DISK, EDIT_VM_DISK } from '_/constants'

import {
  callExternalAction,
  delay,
  delayInMsSteps,
  entityPermissionsToUserPermits,
} from './utils'

import {
  addDiskRemovalPendingTask,
  removeDiskRemovalPendingTask,
  extractErrorText,
  updateVmDisk,
  setVmDisks,
} from '_/actions'

import {
  setNewDiskDialogProgressIndicator,
  setNewDiskDialogErrorText,
  setNewDiskDialogDone,
} from '_/components/NewDiskDialog/actions'

import { canUserEditDisk } from '_/utils'

function* transformAndPermitDiskAttachment (attachment) {
  const internalDisk = Transforms.DiskAttachment.toInternal({ attachment, disk: attachment.disk })

  internalDisk.userPermits = yield entityPermissionsToUserPermits(internalDisk)
  internalDisk.canUserEditDisk = canUserEditDisk(internalDisk.userPermits)

  return internalDisk
}

function* fetchVmDisks ({ vmId }) {
  const diskattachments = yield callExternalAction('diskattachments', Api.diskattachments, { payload: { vmId } })

  const internalDisks = []

  if (diskattachments?.disk_attachment) {
    for (const attachment of diskattachments.disk_attachment) {
      internalDisks.push(yield transformAndPermitDiskAttachment(attachment))
    }
  }

  yield put(setVmDisks({ vmId, disks: internalDisks }))
  return internalDisks
}

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
    yield fetchVmDisks({ vmId })
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
    yield fetchVmDisks({ vmId: vmToRefreshId })
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
  yield fetchVmDisks({ vmId })
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
    attachment => attachment.disk && attachment.disk.status && attachment.disk.status !== 'locked'
  )
}

// NOTE: test() is given the untransformed API version of the attachment
function* waitForDiskAttachment (vmId, attachmentId, test, canBeMissing = false) {
  let metTest = false

  for (const delayMs of delayInMsSteps()) {
    const apiDiskAttachment = yield callExternalAction(
      'diskattachment',
      Api.diskattachment,
      { payload: { vmId, attachmentId } },
      canBeMissing
    )

    if (!apiDiskAttachment.error) {
      const edited = yield transformAndPermitDiskAttachment(apiDiskAttachment)
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
