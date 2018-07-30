import { put, takeEvery, takeLatest } from 'redux-saga/effects'

import { ADD_NEW_VM, EDIT_VM } from './constants'
import Api from '../../ovirtapi'
import { callExternalAction } from '../../saga/utils'
import { fetchSingleVm } from '../../sagas'
import { refresh, getSingleVm } from '../../actions'
import { setSavedVm } from './actions'

function* createNewVm (action) {
  const result = yield callExternalAction('addNewVm', Api.addNewVm, action)
  if (!result.error) {
    yield put(refresh({ page: action.payload.page }))
    yield put(setSavedVm({ vm: Api.vmToInternal({ vm: result }) }))
  }
}

function* editVm (action) {
  const result = yield callExternalAction('editVm', Api.editVm, action)
  if (!result.error) {
    const result2 = yield callExternalAction('changeCD', Api.changeCD, {
      type: 'CHANGE_CD',
      payload: {
        vmId: action.payload.vm.id,
        cdrom: action.payload.vm.cdrom,
        running: action.payload.vm.status === 'up',
      },
    })
    if (!result2.error) {
      yield fetchSingleVm(getSingleVm({ vmId: action.payload.vm.id }))
      yield put(setSavedVm({ vm: Api.vmToInternal({ vm: result }) }))
    }
  }
}

export default [
  takeEvery(ADD_NEW_VM, createNewVm),
  takeLatest(EDIT_VM, editVm),
]
