import { Map } from 'immutable'
import { UPDATE_ICONS } from '../constants'
import { actionReducer } from './utils'

const initialState = Map()

const icons = actionReducer(initialState, {
  [UPDATE_ICONS] (state, { payload: { icons } }) {
    const updates = {}
    icons.forEach(icon => { updates[icon.id] = icon })
    // we don't need deep-immutable
    return state.merge(updates)
  },
})

export default icons
export {
  initialState,
}
