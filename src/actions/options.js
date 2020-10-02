// @flow

import type { UserOptionsType, SshKeyType } from '_/ovirtapi/types'
import type { LoadUserOptionsActionType, SaveGlobalOptionsActionType } from '_/actions/types'

import {
  GET_CONSOLE_OPTIONS,
  SAVE_CONSOLE_OPTIONS,
  SET_CONSOLE_OPTIONS,
  GET_SSH_KEY,
  SAVE_GLOBAL_OPTIONS,
  SAVE_SSH_KEY,
  SET_SSH_KEY,
  SET_OPTION,
  LOAD_USER_OPTIONS,
  LOAD_USER_OPTIONS_IN_PROGRESS,
  LOAD_USER_OPTIONS_FINISHED,
  PERSIST_OPTIONS,
} from '_/constants'

export function setConsoleOptions ({ vmId, options }: Object): Object {
  return {
    type: SET_CONSOLE_OPTIONS,
    payload: {
      vmId,
      options,
    },
  }
}

export function getConsoleOptions ({ vmId }: Object): Object {
  return {
    type: GET_CONSOLE_OPTIONS,
    payload: {
      vmId,
    },
  }
}

export function saveConsoleOptions ({ vmId, options }: Object): Object {
  return {
    type: SAVE_CONSOLE_OPTIONS,
    payload: {
      vmId,
      options,
    },
  }
}

export function getSSHKey ({ userId }: Object): Object {
  return {
    type: GET_SSH_KEY,
    payload: {
      userId,
    },
  }
}

export function setSSHKey ({ key, id }: SshKeyType): Object {
  return {
    type: SET_SSH_KEY,
    payload: {
      key,
      id,
    },
  }
}

export function setOption ({ key, value }: Object): Object {
  return {
    type: SET_OPTION,
    payload: {
      key,
      value,
    },
  }
}

export function loadUserOptions (userOptions: UserOptionsType): LoadUserOptionsActionType {
  return {
    type: LOAD_USER_OPTIONS,
    payload: {
      userOptions,
    },
  }
}

export function loadingUserOptionsInProgress (): Object {
  return {
    type: LOAD_USER_OPTIONS_IN_PROGRESS,
  }
}

export function loadingUserOptionsFinished (): Object {
  return {
    type: LOAD_USER_OPTIONS_FINISHED,
  }
}

export function saveGlobalOptions ({ values: { sshKey, language, showNotifications, notificationSnoozeDuration, updateRate } = {} }: Object, { transactionId }: Object): SaveGlobalOptionsActionType {
  return {
    type: SAVE_GLOBAL_OPTIONS,
    payload: {
      sshKey,
      language,
      showNotifications,
      notificationSnoozeDuration,
      updateRate,
    },
    meta: {
      transactionId,
    },
  }
}

export function saveSSHKey ({ key, userId, sshId }: Object): Object {
  return {
    type: SAVE_SSH_KEY,
    payload: {
      key,
      userId,
      sshId,
    },
  }
}

export function persistUserOptions ({ options, userId }: Object): Object {
  return {
    type: PERSIST_OPTIONS,
    payload: {
      options,
      userId,
    },
  }
}
