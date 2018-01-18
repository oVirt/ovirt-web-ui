import Immutable from 'immutable'
import { SET_SSH_KEY, SET_UNLOADED } from './constants'

export function reducer (state, action) {
  state = state || Immutable.fromJS({ sshKey: null, sshId: undefined, loaded: false })

  switch (action.type) {
    case SET_SSH_KEY:
      return state.set('sshKey', action.payload.key).set('sshId', action.payload.id).set('loaded', true)
    case SET_UNLOADED:
      return state.set('loaded', false)
    default:
      return state
  }
}
