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

  yield clearBootableFlagOnVm(vmId, result)
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
  yield fetchDisks({ vms: [ { id: vmId } ] })
}

function* clearBootableFlagOnVm (vmId, currentDisk) {
  const vmDisks = yield select(state => state.vms.getIn([ 'vms', vmId, 'disks' ]))
  const bootableDisk = vmDisks.find(disk => disk.get('bootable'))

  if (bootableDisk && bootableDisk.get('id') !== currentDisk.id) {
    const removeBootable = bootableDisk.toJS()
    removeBootable.bootable = false

    // NOTE: Only the attachment needs to be adjusted, but since we put the attachment
    //       and the disk information together, we'd need to update the Api call to get
    //       a clean attachment only update.  However, it shouldn't cause any problem
    //       to just send the whole disk back without changes.
    const result = yield callExternalAction(
      'updateDiskAttachment',
      Api.updateDiskAttachment,
      { payload: { disk: removeBootable, vmId } }
    )
    if (result.error) {
      console.error('Problem removing the bootable flag :shrug:', result.error)
    }
  }
}
function* waitForDiskToBeUnlocked (vmId, attachmentId) {
  return yield waitForDiskAttachment(
    vmId,
    attachmentId,
    attachment => attachment.disk && attachment.disk.status && attachment.disk.status !== 'locked',
  )
}

// TODO: drop polling in favor of events (see https://github.com/oVirt/ovirt-web-ui/pull/390)
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
