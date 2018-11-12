import { put, takeEvery } from 'redux-saga/effects'
import { SAVE_SSH_KEY, GET_SSH_KEY } from './constants'
import { setSSHKey, setUnloaded } from './actions'
import { callExternalAction } from '_/saga/utils'
import Api from '_/ovirtapi'

function* saveSSHKey (action) {
  yield callExternalAction('saveSSHKey', Api.saveSSHKey, action)
}

function* getSSHKey (action) {
  yield put(setUnloaded())
  const result = yield callExternalAction('getSSHKey', Api.getSSHKey, action)
  if (result.error) {
    return
  }
  if (result.ssh_public_key && result.ssh_public_key.length > 0) {
    yield put(setSSHKey(Api.SSHKeyToInternal({ sshKey: result.ssh_public_key[0] })))
  } else {
    yield put(setSSHKey(Api.SSHKeyToInternal({ sshKey: '' })))
  }
}

export default [
  takeEvery(SAVE_SSH_KEY, saveSSHKey),
  takeEvery(GET_SSH_KEY, getSSHKey),
]
