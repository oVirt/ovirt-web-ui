// @flow
import * as C from '_/constants'
import type { RemoteUserOptionsType } from '_/ovirtapi/types'

export type LoadUserOptionsActionType = {
  type: C.LOAD_USER_OPTIONS,
  payload: {
    userOptions: RemoteUserOptionsType
  }
}

export type SaveGlobalOptionsActionType = {
  type: C.SAVE_GLOBAL_OPTIONS,
  payload: {|
    refreshInterval?: number,
    language?: string,
    persistLocale?: boolean,
    showNotifications?: boolean,
    notificationSnoozeDuration?: number,
    sshKey?: string,
    preferredConsole?: string,
    fullScreenVnc?: boolean,
    ctrlAltEndVnc?: boolean,
    fullScreenSpice?: boolean,
    ctrlAltEndSpice?: boolean,
    smartcardSpice?: boolean
  |},
  meta: {|
    transactionId: string
  |}
}
export type MessageDescriptorType = {
  id: string,
  params: ?Object
}
export type FailedExternalActionInputType = {
  message: string,
  messageDescriptor: ?MessageDescriptorType,
  exception?: Object,
  failedAction?: Object
}

export type FailedExternalActionType = {
  type: 'FAILED_EXTERNAL_ACTION',
  payload: {
    message: string,
    failedAction?: Object
  } | {
    message: string,
    messageDescriptor: ?MessageDescriptorType,
    type: number | 'ERROR',
    failedAction: Object
  }
}
