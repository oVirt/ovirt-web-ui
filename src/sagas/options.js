// @flow

import Api from '_/ovirtapi'
import { all, put, select, takeLatest, call } from 'redux-saga/effects'

import * as A from '_/actions'
import { callExternalAction } from './utils'

import * as C from '_/constants'

import type { SaveGlobalOptionsActionType } from '_/actions/types'

/**
 * Internal type to formalize result returned from
 * saveSSHKey and saveRemoteOptions sagas.
 */
type ResultType = {
  // list of field names submitted as changed
  changes: Array<string>,
  // true if no changes were detected
  // all submitted values are the same as currently stored
  sameAsCurrent: boolean,
  // true if error was reported by ovirtapi query
  error: boolean,
  // query specific data packed into one object
  data: Object
}

/**
 * Simple mapper providing default values and type safety.
 */
function toResult ({ error = false, changes = [], sameAsCurrent = false, ...data }: Object = {}): ResultType {
  return {
    changes,
    sameAsCurrent,
    error,
    data,
  }
}

function* fetchSSHKey (action: Object): any {
  const result = yield call(callExternalAction, 'getSSHKey', Api.getSSHKey, action)
  if (result.error) {
    return
  }

  yield put(A.setSSHKey(Api.SSHKeyToInternal({ sshKey: result })))
}

function* saveSSHKey ([ sshPropName, submittedKey ]: any): any | ResultType {
  if (submittedKey === undefined) {
    // check strictly for undefined
    // it should be possible to clear ssh key by setting to empty string
    return toResult()
  }
  const sshId = yield select((state) => state.options.getIn(['ssh', 'id']))
  const currentKey = yield select((state) => state.options.getIn(['ssh', 'key']))
  if (currentKey === submittedKey) {
    return toResult({ changes: [sshPropName], sameAsCurrent: true })
  }
  const userId = yield select((state) => state.config.getIn(['user', 'id']))
  const result = yield call(
    callExternalAction,
    'saveSSHKey',
    Api.saveSSHKey,
    A.saveSSHKey({ sshId, key: submittedKey, userId }),
    true)

  return toResult({ ...result, changes: [sshPropName] })
}

/**
 * Required to delay destructive side effects of user option changes.
 * Effect should wait until 'finish' event was dispatched.
 * Primary use case is page reload after locale change.
 */
function withLoadingUserOptions (delegateGenerator: (any) => Generator<any, any, any>): any {
  return function* (action: any): any {
    yield put(A.loadingUserOptionsInProgress())
    try {
      yield call(delegateGenerator, action)
    } finally {
      yield put(A.loadingUserOptionsFinished())
    }
  }
}

function* saveGlobalOptions ({ payload: { sshKey, showNotifications, notificationSnoozeDuration }, meta: { transactionId } }: SaveGlobalOptionsActionType): Generator<any, any, any> {
  const { ssh } = yield all({
    ssh: call(saveSSHKey, ...Object.entries({ sshKey })),
  })

  if (!ssh.error && ssh.changes.length && !ssh.sameAsCurrent) {
    yield put(A.setSSHKey(Api.SSHKeyToInternal({ sshKey: ssh.data })))
  }

  if (showNotifications !== undefined || notificationSnoozeDuration !== undefined) {
    yield call(
      updateNotifications,
      {
        current: yield select((state) => state.options.getIn(['global', 'showNotifications'])),
        next: showNotifications,
      },
      {
        current: yield select((state) => state.options.getIn(['global', 'notificationSnoozeDuration'])),
        next: notificationSnoozeDuration,
      })
  }

  yield put(
    A.setOption(
      { key: ['lastTransactions', 'global'], value: { transactionId } },
    ),
  )
}

function* updateNotifications (show: {current: boolean, next?: boolean}, snooze: {current: number, next?: number}): any {
  const snoozeDuration = snooze.next || snooze.current
  const showNotifications = show.next === undefined ? show.current : show.next
  const snoozeUntilPageReload = snoozeDuration === Number.MAX_SAFE_INTEGER

  yield put(A.setOption({ key: ['global', 'showNotifications'], value: showNotifications }))
  yield put(A.setOption({ key: ['global', 'notificationSnoozeDuration'], value: snoozeDuration }))
  yield put(A.setAutoAcknowledge(!showNotifications))
  if (showNotifications || snoozeUntilPageReload) {
    yield put(A.stopSchedulerForResumingNotifications())
  } else {
    // minutes -> seconds
    yield put(A.startSchedulerForResumingNotifications(snoozeDuration * 60))
  }
}

export function* resumeNotifications (): any {
  yield call(
    updateNotifications,
    {
      current: yield select((state) => state.options.getIn(['global', 'showNotifications'])),
      next: true,
    },
    {
      current: yield select((state) => state.options.getIn(['global', 'notificationSnoozeDuration'])),
    })
}

export function* loadUserOptions (): any {
  const userId = yield select(state => state.config.getIn(['user', 'id']))
  yield put(A.getSSHKey({ userId }))
  yield put(A.loadingUserOptionsFinished())
}

export default [
  takeLatest(C.SAVE_SSH_KEY, saveSSHKey),
  takeLatest(C.SAVE_GLOBAL_OPTIONS, withLoadingUserOptions(saveGlobalOptions)),
  takeLatest(C.GET_SSH_KEY, fetchSSHKey),
]
