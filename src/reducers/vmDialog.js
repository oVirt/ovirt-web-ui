import { fromJS } from 'immutable'
import { actionReducer } from './utils'

const vmDialogReducer = actionReducer(fromJS({
  errorMessage: '',
}), {
  UPDATE_VM_DIALOG_ERROR_MESSAGE (state, { payload: { message } }) { // TODO: Handle via UserMessages
    return state.set('errorMessage', fromJS(message))
  },
})

export default vmDialogReducer
