import {
  EVENT_LISTENER,
  GET_EVENTS,
} from '../constants/index'

export function eventListener () {
  return {
    type: EVENT_LISTENER,
    payload: {},
  }
}

export function getEvents ({ lastEventIndexReceived }) {
  return {
    type: GET_EVENTS,
    payload: {
      lastEventIndexReceived,
    },
  }
}
