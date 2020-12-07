// @flow
import * as C from '_/constants'
import type { UserOptionsType } from '_/ovirtapi/types'

export type LoadUserOptionsActionType = {
  type: C.LOAD_USER_OPTIONS,
  payload: {
    userOptions: UserOptionsType
  }
}

export type SaveGlobalOptionsActionType = {
  type: C.SAVE_GLOBAL_OPTIONS,
  payload: {|
    updateRate?: number,
    language?: string,
    showNotifications?: boolean,
    notificationSnoozeDuration?: number,
    sshKey?: string
  |},
  meta: {|
    transactionId: string
  |}
}
