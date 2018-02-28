import { fromJS } from 'immutable'

import { actionReducer } from '../../reducers/utils'
import {
  CLEAN_NEW_DISK_DIALOG_SUBTREE,
  SET_NEW_DISK_DIALOG_ERROR_TEXT,
  SET_NEW_DISK_DIALOG_PROGRESS_INDICATOR,
  SET_NEW_DISK_DIALOG_DONE,
} from './constants'

const initialState = fromJS({
  errorText: undefined,
  showProgressIndicator: undefined,
  done: undefined,
})

export default actionReducer(initialState, {
  [CLEAN_NEW_DISK_DIALOG_SUBTREE] (state, action) {
    return initialState
  },
  [SET_NEW_DISK_DIALOG_ERROR_TEXT] (state, { payload: { errorText } }) {
    return state.set('errorText', errorText)
  },
  [SET_NEW_DISK_DIALOG_PROGRESS_INDICATOR] (state, { payload: { visible } }) {
    return state.set('showProgressIndicator', visible)
  },
  [SET_NEW_DISK_DIALOG_DONE] (state, action) {
    return state.set('done', true)
  },
})
