import Immutable from 'immutable'
import { SET_CONSOLE_IN_USE } from '../constants'
import { actionReducer } from './utils'

const consoles = actionReducer(Immutable.fromJS({ vms: {} }), {
  [SET_CONSOLE_IN_USE] (state, { payload: { vmId, consoleInUse } }) {
    return state.setIn(['vms', vmId, 'consoleInUse'], consoleInUse)
  },
})

export default consoles
