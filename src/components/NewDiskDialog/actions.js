// @flow
/* eslint-disable flowtype/require-return-type */

import {
  CLEAN_NEW_DISK_DIALOG_SUBTREE,
  SET_NEW_DISK_DIALOG_PROGRESS_INDICATOR,
  SET_NEW_DISK_DIALOG_ERROR_TEXT,
  SET_NEW_DISK_DIALOG_DONE,
} from 'app-constants'

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
