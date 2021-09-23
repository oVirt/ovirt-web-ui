// @flow

import produce from 'immer'
import { ADD_ACTIVE_REQUEST, REMOVE_ACTIVE_REQUEST } from '_/constants'
import { actionReducer } from './utils'

type ActiveRequestsStateType = Array<string>

const initialState: ActiveRequestsStateType = []

/*
 * NOTE: immer has a pitfall where drafts are not referentially equal to the original
 *       objects.  So any operation that relies on `==`, `===`, or `Object.is()` for
 *       object references wont work without help.  To side-step that issue in this
 *       reducer, the `requestId` is normalized to a JSON string.  String comparisons
 *       with `==` and `===` are not subject to this pitfall.
 *
 * See: https://immerjs.github.io/immer/pitfalls#drafts-arent-referentially-equal
 */

const activeRequestsReducer = actionReducer(initialState, {
  [ADD_ACTIVE_REQUEST]: produce((draft: ActiveRequestsStateType, { payload: requestId }) => {
    const normalizedId = JSON.stringify(requestId)
    if (draft.find(id => id === normalizedId) === undefined) {
      draft.push(normalizedId)
    }
  }),

  [REMOVE_ACTIVE_REQUEST]: produce((draft: ActiveRequestsStateType, { payload: requestId }) => {
    const normalizedId = JSON.stringify(requestId)
    const d = draft.filter(id => id !== normalizedId)
    return d
  }),
})

export default activeRequestsReducer
