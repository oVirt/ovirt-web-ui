import { put, takeEvery } from 'redux-saga/effects'
import { SAVE_SSH_KEY, GET_SSH_KEY } from './constants'
import { setSSHKey, setUnloaded } from './actions'
import Api from '../../ovirtapi'

function* saveSSHKey (sagas, action) {
  yield sagas.callExternalAction('saveSSHKey', Api.saveSSHKey, action)
}

function* getSSHKey (sagas, action) {
  yield put(setUnloaded())
  const result = yield sagas.callExternalAction('getSSHKey', Api.getSSHKey, action)
  if (!result.error && result.ssh_public_key && result.ssh_public_key.length > 0) {
    yield put(setSSHKey(Api.SSHKeyToInternal({ sshKey: result.ssh_public_key[0] })))
  }
}

export function buildSagas (sagas) {
  return [
    takeEvery(SAVE_SSH_KEY, saveSSHKey, sagas),
    takeEvery(GET_SSH_KEY, getSSHKey, sagas),
  ]
}
