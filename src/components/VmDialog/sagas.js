import { put, takeEvery, takeLatest } from 'redux-saga/effects'
import { refresh, getSingleVm } from '../../actions/index'
import { ADD_NEW_VM, EDIT_VM } from './constants'
import { setSavedVm } from './actions'
import Api from '../../ovirtapi'

function* createNewVm (sagas, action) {
  const result = yield sagas.callExternalAction('addNewVm', Api.addNewVm, action)
  if (!result.error) {
    yield put(refresh({ page: action.payload.page }))
    yield put(setSavedVm({ vm: Api.vmToInternal({ vm: result }) }))
  }
}

function* editVm (sagas, action) {
  const result = yield sagas.callExternalAction('editVm', Api.editVm, action)
  if (!result.error) {
    yield sagas.fetchSingleVm(getSingleVm({ vmId: action.payload.vm.id }))
    yield put(setSavedVm({ vm: Api.vmToInternal({ vm: result }) }))
  }
}

export function buildSagas (sagas) {
  return [
    takeEvery(ADD_NEW_VM, createNewVm, sagas),
    takeLatest(EDIT_VM, editVm, sagas),
  ]
}
