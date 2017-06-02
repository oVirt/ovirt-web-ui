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
  selectedPoolDetail: undefined,

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
      .delete('selectedPoolDetail')
      .set('dialogToShow', null)
      .set('dialogConfirmationRequested', null)
      .set('dialogCloseConfirmationToShow', null)
  },

  TOGGLE_OPTIONS (state) { // TODO: rename to OPEN_SETTINGS
    return state
      .set('dialogToShow', state.get('dialogToShow') === 'Options' ? null : 'Options')
  },
})

export default visibility
