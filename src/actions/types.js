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
    showNotifications?: boolean,
    notificationSnoozeDuration?: number,
    sshKey?: string
  |},
  meta: {|
    transactionId: string
  |}
}
