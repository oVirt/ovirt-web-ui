import { Map } from 'immutable'

function updateOrAdd ({ state, payload: { icons } }) {
  const updates = {}
  icons.forEach(icon => { updates[icon.id] = icon })
  // we don't need deep-immutable
  return state.merge(updates)
}

/**
 * The Icons reducer
 *
 * @param state
 * @param action
 * @returns {*}
 */
function icons (state = Map(), action) {
  switch (action.type) {
    case 'UPDATE_ICONS': // add or update
      return updateOrAdd({ state, payload: action.payload })
    default:
      return state
  }
}

export default icons
