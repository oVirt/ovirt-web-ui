import Immutable from 'immutable'

/**
 * The Visibility reducer
 *
 * Functionality connected with this reducer will be probably replaced by react-router in the future
 *
 * @param state
 * @param action
 * @returns {*}
 */
function visibility (state, action) {
  state = state || Immutable.fromJS({ showOptions: false, selectedVmDetail: undefined })

  switch (action.type) {
    case 'TOGGLE_OPTIONS':
      return state.set('showOptions', !state.get('showOptions'))
    case 'SET_VM_DETAIL_TO_SHOW':
      return state.set('selectedVmDetail', action.payload.vmId)
    case 'CLOSE_DETAIL':
      return state.delete('selectedVmDetail').set('showOptions', false)
    default:
      return state
  }
}

export default visibility
