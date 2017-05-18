import Immutable from 'immutable'
import { SET_SAVED_VM } from './constants'

export function reducer (state, action) {
  state = state || Immutable.fromJS({ vm: null })

  switch (action.type) {
    case SET_SAVED_VM:
      return state.set('vm', Immutable.fromJS(action.payload.vm))
    default:
      return state
  }
}
