// @flow

import type { RequestTrackerType } from '_/ovirtapi'
import {
  ADD_ACTIVE_REQUEST,
  REMOVE_ACTIVE_REQUEST,
  DELAYED_REMOVE_ACTIVE_REQUEST,
} from '_/constants'

export function addActiveRequest ({ method, url, uid }: RequestTrackerType): Object {
  return {
    type: ADD_ACTIVE_REQUEST,
    payload: {
      method,
      url,
      uid,
    },
  }
}

export function removeActiveRequest ({ method, url, uid }: RequestTrackerType): Object {
  return {
    type: REMOVE_ACTIVE_REQUEST,
    payload: {
      method,
      url,
      uid,
    },
  }
}

export function delayedRemoveActiveRequest ({ method, url, uid }: RequestTrackerType): Object {
  return {
    type: DELAYED_REMOVE_ACTIVE_REQUEST,
    payload: {
      method,
      url,
      uid,
    },
  }
}
