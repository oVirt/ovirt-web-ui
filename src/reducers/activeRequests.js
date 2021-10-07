// @flow

import produce from 'immer'
import { ADD_ACTIVE_REQUEST, REMOVE_ACTIVE_REQUEST } from '_/constants'
import { actionReducer } from './utils'

import type { RequestTrackerType } from '_/ovirtapi'

type ActiveRequestsStateType = Array<string>

const initialState: ActiveRequestsStateType = []

/*
 * NOTE: immer has a pitfall where drafts are not referentially equal to the original
 *       objects.  So any operation that relies on `==`, `===`, or `Object.is()` for
 *       object references wont work without help.  To side-step that issue in this
 *       reducer, we rely on string comparison.  String comparisons with `==` and `===`
 *       are not subject to this pitfall.
 *
 * See: https://immerjs.github.io/immer/pitfalls#drafts-arent-referentially-equal
 */

const activeRequestsReducer = actionReducer(initialState, {
  [ADD_ACTIVE_REQUEST]: produce(
    (draft: ActiveRequestsStateType, { payload: { method, url, uid } }: { payload: RequestTrackerType }) => {
      if (draft.find(knownUid => knownUid === uid) === undefined) {
        draft.push(uid)
      }
    }
  ),

  [REMOVE_ACTIVE_REQUEST]: produce(
    (draft: ActiveRequestsStateType, { payload: { method, url, uid } }: { payload: RequestTrackerType }) => {
      const d = draft.filter(knownUid => knownUid !== uid)
      return d
    }
  ),
})

export default activeRequestsReducer
