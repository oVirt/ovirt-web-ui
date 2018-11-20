import {
  ADD_ACTIVE_REQUEST,
  REMOVE_ACTIVE_REQUEST,
  DELAYED_REMOVE_ACTIVE_REQUEST,
} from '_/constants'

export function addActiveRequest (requestId) {
  return {
    type: ADD_ACTIVE_REQUEST,
    payload: requestId,
  }
}

export function removeActiveRequest (requestId) {
  return {
    type: REMOVE_ACTIVE_REQUEST,
    payload: requestId,
  }
}

export function delayedRemoveActiveRequest (requestId) {
  return {
    type: DELAYED_REMOVE_ACTIVE_REQUEST,
    payload: requestId,
  }
}
