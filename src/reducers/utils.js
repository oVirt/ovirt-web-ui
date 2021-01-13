import { Map } from 'immutable'
import { UPDATE_ICONS, REMOVE_ACTIVE_REQUEST, DELAYED_REMOVE_ACTIVE_REQUEST, ADD_ACTIVE_REQUEST } from '_/constants'
import {
  EMPTY_CONSOLES_LIST,
  NO_DEFAULT_CONSOLE,
} from '_/constants/consoleAutoSelect'

/**
 * Takes initial state of the reducer and a map of action handlers and returns a redux-compatible reducer.
 *
 * <pre><code>
 * // Definitions like this
 *
 * function reducer (state = initialState, action) {
 *   switch (action.type) {
 *   case 'ACTION_1':
 *     return // code 1
 *   case 'ACTION_2:
 *     return // code 2
 *   default:
 *     return state
 *   }
 * }
 *
 * // Can be replaced with
 *
 * const reducer = actionReducer(initialState, {
 *   ACTION_1 (state, action) {
 *     return // code 1
 *   },
 *   ACTION_2 (state, action) {
 *     return // code 2
 *   },
 * })
 * </code></pre>
 *
 * @param initialState initial value to be used for reducer state
 * @param handlers a map of handler functions where name of each action corresponds to a given action `type`
 * @returns {Function} a redux-compatible reducer
 */
export const actionReducer = (initialState, handlers, verbose) => (state = initialState, action) => {
  if (verbose) {
    let actionJson = JSON.stringify(action)
    if (actionJson.length > 250) {
      if (action.type === UPDATE_ICONS) {
        actionJson = actionJson.substring(0, 50) + ' ... [truncated] ...'
      }
    }

    if (![ ADD_ACTIVE_REQUEST, REMOVE_ACTIVE_REQUEST, DELAYED_REMOVE_ACTIVE_REQUEST ].includes(action.type)) {
      console.log('Reducing action:', actionJson)
    }
  }

  if (action.type in handlers) {
    return handlers[action.type](state, action)
  }
  return state
}

export function removeMissingItems ({ state, subStateName, idsToPreserve }) {
  const newItems = idsToPreserve
    .reduce((items, id) => {
      const item = state.getIn([subStateName, id])
      if (item) {
        items.set(id, item)
      }
      return items
    }, Map().asMutable())
    .asImmutable()
  return state.set(subStateName, newItems)
}
export function selectDefaultConsoleProtocol (defaultProtocol, consoles = []) {
  if (consoles.length > 0) {
    if (consoles.length === 1) {
      return consoles[0].protocol
    } else {
      const selectedProtocol = consoles.find(c => c.protocol === defaultProtocol)
      return selectedProtocol ? selectedProtocol.protocol : NO_DEFAULT_CONSOLE
    }
  }
  return EMPTY_CONSOLES_LIST
}
