import Immutable from 'immutable'
import { SET_SSH_KEY } from './constants'

export function reducer (state, action) {
  state = state || Immutable.fromJS({ sshKey: null, sshId: undefined })

  switch (action.type) {
    case SET_SSH_KEY:
      return state.set('sshKey', action.payload.key).set('sshId', action.payload.id)
    default:
      return state
  }
}
