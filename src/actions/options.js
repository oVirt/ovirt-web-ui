// @flow

import type { RemoteUserOptionsType, SshKeyType } from '_/ovirtapi/types'
import type { LoadUserOptionsActionType, SaveGlobalOptionsActionType } from '_/actions/types'

import * as C from '_/constants'

export function setConsoleOptions ({ vmId, options }: Object): Object {
  return {
    type: C.SET_CONSOLE_OPTIONS,
    payload: {
      vmId,
      options,
    },
  }
}

export function getConsoleOptions ({ vmId }: Object): Object {
  return {
    type: C.GET_CONSOLE_OPTIONS,
    payload: {
      vmId,
    },
  }
}

export function saveConsoleOptions ({ vmId, options }: Object): Object {
  return {
    type: C.SAVE_CONSOLE_OPTIONS,
    payload: {
      vmId,
      options,
    },
  }
}

export function getSSHKey ({ userId }: Object): Object {
  return {
    type: C.GET_SSH_KEY,
    payload: {
      userId,
    },
  }
}

export function setSSHKey ({ key, id }: SshKeyType): Object {
  return {
    type: C.SET_SSH_KEY,
    payload: {
      key,
      id,
    },
  }
}

export function setOption ({ key, value }: Object): Object {
  return {
    type: C.SET_OPTION,
    payload: {
      key,
      value,
    },
  }
}

export function loadUserOptions (userOptions: RemoteUserOptionsType): LoadUserOptionsActionType {
  return {
    type: C.LOAD_USER_OPTIONS,
    payload: {
      userOptions,
    },
  }
}

export function loadingUserOptionsInProgress (): Object {
  return {
    type: C.LOAD_USER_OPTIONS_IN_PROGRESS,
  }
}

export function loadingUserOptionsFinished (): Object {
  return {
    type: C.LOAD_USER_OPTIONS_FINISHED,
  }
}

export function saveGlobalOptions ({ values: { sshKey, language, showNotifications, notificationSnoozeDuration, updateRate } = {} }: Object, { transactionId }: Object): SaveGlobalOptionsActionType {
  return {
    type: C.SAVE_GLOBAL_OPTIONS,
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
    type: C.SAVE_SSH_KEY,
    payload: {
      key,
      userId,
      sshId,
    },
  }
}

export function persistUserOption ({ userId, name, content, optionId }: Object): Object {
  return {
    type: C.PERSIST_OPTION,
    payload: {
      userId,
      name,
      content,
      optionId,
    },
  }
}

export function fetchUserOptions ({ userId }: Object): Object {
  return {
    type: C.FETCH_OPTIONS,
    payload: {
      userId,
    },
  }
}
