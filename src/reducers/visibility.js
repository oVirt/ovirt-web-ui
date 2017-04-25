import Immutable from 'immutable'
import { actionReducer } from './utils'

/**
 * The Visibility reducer
 *
 * Functionality connected with this reducer will be probably replaced by react-router in the future
 *
 * @param state
 * @param action
 * @returns {*}
 */
const visibility = actionReducer(Immutable.fromJS({
  dialogToShow: undefined, // undefined, 'VmDetail', 'VmDialog', 'Options'
  selectedVmDetail: undefined, // applicable if dialogToShow === 'VmDetail'

  dialogConfirmationRequested: undefined, // if true, rendered dialog contains dirty data
  dialogCloseConfirmationToShow: undefined, // if true, the dialog is about to close but contains changes requiring user confirmation
}), {
  CLOSE_DIALOG (state, action) {
    if (!action.payload.force && state.get('dialogConfirmationRequested')) {
      return state
        .set('dialogCloseConfirmationToShow', true)
    }

    return state
      .delete('selectedVmDetail')
      .set('dialogToShow', null)
      .set('dialogConfirmationRequested', null)
      .set('dialogCloseConfirmationToShow', null)
  },

  REQUEST_CLOSE_DIALOG_CONFIRMATION (state) {
    return state
      .set('dialogConfirmationRequested', true)
      .set('dialogCloseConfirmationToShow', false)
  },

  TOGGLE_OPTIONS (state) { // TODO: rename to OPEN_SETTINGS
    return state
      .set('dialogToShow', state.get('dialogToShow') === 'Options' ? null : 'Options')
  },
  SET_VM_DETAIL_TO_SHOW (state, action) { // rename to OPEN_VM_DETAIL
    return state
      .set('selectedVmDetail', action.payload.vmId)
      .set('dialogToShow', 'VmDetail')
  },

  OPEN_ADD_VM_DIALOG (state) {
    return state
      .set('dialogToShow', 'VmDialog')
  },

  OPEN_EDIT_VM_DIALOG (state, action) {
    return state
      .set('dialogToShow', 'VmDialog')
      .set('selectedVmDetail', action.payload.vmId)
  },
})

export default visibility
