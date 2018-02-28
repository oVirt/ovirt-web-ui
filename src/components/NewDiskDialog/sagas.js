import { takeEvery, put } from 'redux-saga/effects'

import { CREATE_DISK_FOR_VM } from './constants'
import Api from '../../ovirtapi'
import { callExternalAction } from '../../saga/utils'
import { fetchDisks } from '../../sagas'
import {
  setNewDiskDialogProgressIndicator,
  setNewDiskDialogErrorText,
  setNewDiskDialogDone,
} from './actions'
import { extractErrorText } from '../../actions'

function* createDiskForVm (action) {
  yield put(setNewDiskDialogProgressIndicator(true))
  const vmId = action.payload.vmId
  const result = yield callExternalAction('addDiskAttachment', Api.addDiskAttachment, action)
  if (result.error) {
    const errorText = extractErrorText(result.error)
    yield put(setNewDiskDialogErrorText(errorText))
  } else {
    yield fetchDisks({ vms: [ { id: vmId } ] })
    yield put(setNewDiskDialogDone())
  }
  yield put(setNewDiskDialogProgressIndicator(false))
}

export default [
  takeEvery(CREATE_DISK_FOR_VM, createDiskForVm),
]
