// @flow
/* eslint-disable flowtype/require-return-type */

import {
  CREATE_DISK_FOR_VM,
  CLEAN_NEW_DISK_DIALOG_SUBTREE,
  SET_NEW_DISK_DIALOG_PROGRESS_INDICATOR,
  SET_NEW_DISK_DIALOG_ERROR_TEXT,
  SET_NEW_DISK_DIALOG_DONE,
} from './constants'

export function createDiskForVm (sizeB: string, alias: string, storageDomainId: string, iface: string, vmId: string) {
  return {
    type: CREATE_DISK_FOR_VM,
    payload: {
      sizeB,
      alias,
      storageDomainId,
      vmId,
      iface,
      active: true,
    },
  }
}

export function cleanNewDiskDialogSubtree () {
  return {
    type: CLEAN_NEW_DISK_DIALOG_SUBTREE,
  }
}

export function setNewDiskDialogProgressIndicator (visible: boolean) {
  return {
    type: SET_NEW_DISK_DIALOG_PROGRESS_INDICATOR,
    payload: { visible },
  }
}

export function setNewDiskDialogErrorText (errorText: boolean) {
  return {
    type: SET_NEW_DISK_DIALOG_ERROR_TEXT,
    payload: { errorText },
  }
}

export function setNewDiskDialogDone () {
  return {
    type: SET_NEW_DISK_DIALOG_DONE,
  }
}
