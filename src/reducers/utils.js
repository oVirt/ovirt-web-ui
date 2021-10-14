import * as C from '_/constants'

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
      if (action.type === C.UPDATE_ICONS) {
        actionJson = actionJson.substring(0, 50) + ' ... [truncated] ...'
      }
    }

    if (![C.ADD_ACTIVE_REQUEST, C.REMOVE_ACTIVE_REQUEST, C.DELAYED_REMOVE_ACTIVE_REQUEST].includes(action.type)) {
      console.log('Reducing action:', actionJson)
    }
  }

  if (action.type in handlers) {
    return handlers[action.type](state, action)
  }
  return state
}
