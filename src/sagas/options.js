// @flow

import Api, { Transforms } from '_/ovirtapi'
import { all, put, select, takeLatest, call } from 'redux-saga/effects'

import * as A from '_/actions'
import { callExternalAction } from './utils'

import * as C from '_/constants'

import type { SaveGlobalOptionsActionType } from '_/actions/types'
import type { UserOptionType, RemoteUserOptionsType } from '_/ovirtapi/types'
import { localeFromUrl, locale as inferredLocale } from '_/intl'
import { generateUnique } from '_/helpers'

/**
 * Internal type to formalize result returned from
 * saveSSHKey and saveRemoteOptions sagas.
 */
type ResultType = {
  // name of the field submitted as changed
  change: string,
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
function toResult ({ error = false, change = undefined, sameAsCurrent = false, ...data }: Object = {}): ResultType {
  return {
    change,
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

  const [sshId, currentKey, userId] = yield select(({ options, config }) => ([
    options.getIn(['ssh', 'id']),
    options.getIn(['ssh', 'key']),
    config.getIn(['user', 'id']),
  ]))

  if (currentKey === submittedKey) {
    return toResult({ change: sshPropName, sameAsCurrent: true })
  }

  const result = yield call(
    callExternalAction,
    'saveSSHKey',
    Api.saveSSHKey,
    A.saveSSHKey({ sshId, key: submittedKey, userId }),
    true)

  return toResult({ ...result, change: sshPropName })
}

function* fetchUserOptions (action: Object): any {
  const result = yield call(callExternalAction, 'fetchUserOptions', Api.fetchUserOptions, action)
  if (!result || result.error) {
    return
  }

  const remoteOptions: RemoteUserOptionsType = Transforms.RemoteUserOptions.toInternal(result)

  yield put(A.loadUserOptions(remoteOptions))

  if (!remoteOptions.locale && remoteOptions.persistLocale && remoteOptions.persistLocale.content) {
    yield call(exportInferredLocale)
  }
}

function* exportInferredLocale (): any {
  yield put(A.saveGlobalOptions({ values: { language: localeFromUrl || inferredLocale } }, { transactionId: generateUnique('exportInferredLocale_') }))
}

/**
 * Remote options are options that are persisted on the server as JSON blob.
 * Note that there are also client-only options that do not need uploading.
 * Exception: SSH keys are remote but are handled separately.
 *
 * @param {*} newOptions options declared as new
  */
function* saveRemoteOption ([ name, value ]: any): any | ResultType {
  if (value === undefined) {
    // no values were submitted
    return toResult()
  }

  const [userId, currentValue, optionId] = yield select(({ options, config }) => [
    config.getIn(['user', 'id']),
    options.getIn(['remoteOptions', name, 'content']),
    options.getIn(['remoteOptions', name, 'id']),
  ])

  // missing option ID indicates that the option does not exist on the server
  if (value === currentValue && optionId) {
    return toResult({ change: name, sameAsCurrent: true })
  }

  const result = (yield call(
    callExternalAction,
    'persistUserOption',
    Api.persistUserOption,
    A.persistUserOption({ name, content: value, optionId, userId }),
    true,
  ))

  if (result.error) {
    return toResult({ ...result, change: name })
  }

  const parsedResult : ?[string, UserOptionType<any>] = Transforms.RemoteUserOption.toInternal(result)
  if (!parsedResult) {
    console.error('Failed to parse the response', result)
    return toResult({ ...result, error: true, change: name })
  }

  const [parsedName, parsedValue] = parsedResult
  return toResult({
    ...result,
    name: parsedName,
    value: parsedValue,
    change: name })
}

function* saveGlobalOptions ({ payload: { sshKey, showNotifications, notificationSnoozeDuration, language, refreshInterval, persistLocale }, meta: { transactionId } }: SaveGlobalOptionsActionType): Generator<any, any, any> {
  const currentPersistLocale = yield select(state => state.options.getIn(['remoteOptions', 'persistLocale', 'content']))
  const enableLocaleChange = persistLocale === undefined ? currentPersistLocale : persistLocale

  const { ssh, locale, refresh, persistLoc } = yield all({
    ssh: call(saveSSHKey, ...Object.entries({ sshKey })),
    locale: enableLocaleChange ? call(saveRemoteOption, ...Object.entries({ locale: language })) : {},
    persistLoc: call(saveRemoteOption, ...Object.entries({ persistLocale })),
    refresh: call(saveRemoteOption, ...Object.entries({ refreshInterval })),
  })

  if (!refresh.error && refresh.change && !refresh.sameAsCurrent) {
    const { name, value } = refresh.data
    yield put(A.setOption({ key: [ 'remoteOptions', name ], value }))
  }

  if (!locale.error && locale.change && !locale.sameAsCurrent) {
    const { name, value } = locale.data
    yield put(A.setOption({ key: [ 'remoteOptions', name ], value }))
  }

  if (!persistLoc.error && persistLoc.change && !persistLoc.sameAsCurrent) {
    const { name, value } = persistLoc.data
    yield put(A.setOption({ key: [ 'remoteOptions', name ], value }))

    if (value && value.content === false) {
      yield call(deleteUserOption, { optionName: 'locale' })
    }
  }

  if (!ssh.error && ssh.change && !ssh.sameAsCurrent) {
    yield put(A.setSSHKey(Api.SSHKeyToInternal({ sshKey: ssh.data })))
  }

  if (showNotifications !== undefined || notificationSnoozeDuration !== undefined) {
    yield call(
      updateNotifications,
      {
        current: yield select((state) => state.options.getIn(['localOptions', 'showNotifications'])),
        next: showNotifications,
      },
      {
        current: yield select((state) => state.options.getIn(['localOptions', 'notificationSnoozeDuration'])),
        next: notificationSnoozeDuration,
      })
  }

  yield put(
    A.setOption(
      { key: ['lastTransactions', 'global'], value: { transactionId } },
    ),
  )
}
function* deleteUserOption ({ optionName, optionId }: Object): any {
  if (!optionId && optionName) {
    optionId = yield (select(state => state.options.getIn(['remoteOptions', optionName, 'id'])))
  }
  if (optionId) {
    const userId = yield (select(({ config }) => config.getIn(['user', 'id'])))
    yield call(
      callExternalAction,
      'persistUserOption',
      Api.deleteUserOption,
      A.deleteUserOption({ optionId, userId }),
      true,
    )
    yield call(fetchUserOptions, A.fetchUserOptions({ userId }))
  }
}

function* updateNotifications (show: {current: boolean, next?: boolean}, snooze: {current: number, next?: number}): any {
  const snoozeDuration = snooze.next || snooze.current
  const showNotifications = show.next === undefined ? show.current : show.next
  const snoozeUntilPageReload = snoozeDuration === Number.MAX_SAFE_INTEGER

  yield put(A.setOption({ key: ['localOptions', 'showNotifications'], value: showNotifications }))
  yield put(A.setOption({ key: ['localOptions', 'notificationSnoozeDuration'], value: snoozeDuration }))
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
      current: yield select((state) => state.options.getIn(['localOptions', 'showNotifications'])),
      next: true,
    },
    {
      current: yield select((state) => state.options.getIn(['localOptions', 'notificationSnoozeDuration'])),
    })
}

export function* loadUserOptions (): any {
  const userId = yield select(state => state.config.getIn(['user', 'id']))
  yield put(A.getSSHKey({ userId }))
  yield put(A.fetchUserOptions({ userId }))
}

export default [
  takeLatest(C.SAVE_SSH_KEY, saveSSHKey),
  takeLatest(C.SAVE_GLOBAL_OPTIONS, saveGlobalOptions),
  takeLatest(C.GET_SSH_KEY, fetchSSHKey),
  takeLatest(C.FETCH_OPTIONS, fetchUserOptions),
]
