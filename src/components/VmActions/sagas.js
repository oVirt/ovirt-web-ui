import { put, takeEvery } from 'redux-saga/effects'
import { downloadConsole } from '../../actions/vm'
import { CONSOLE_IN_USE } from './constants'
import { setConsoleInUse } from './actions'

function * getConsoleInUseModal (sagas, action) {
  let { vmId, usbFilter, userId } = action.payload
  const sessionsInternal = yield sagas.fetchVmSessions({ vmId })
  if (sessionsInternal &&
    sessionsInternal.find(
      (x) => x.consoleUser &&
            (!userId || x.user.id === userId)
    ) !== undefined) {
    yield put(setConsoleInUse({ vmId, consoleInUse: true }))
  } else {
    yield put(downloadConsole({ vmId, usbFilter }))
    yield put(setConsoleInUse({ vmId, consoleInUse: false }))
  }
}

export function buildSagas (sagas) {
  return [
    takeEvery(CONSOLE_IN_USE, getConsoleInUseModal, sagas),
  ]
}
