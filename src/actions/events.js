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

export function getEvents ({ lastReceivedEventIndex }) {
  return {
    type: GET_EVENTS,
    payload: {
      lastReceivedEventIndex,
    },
  }
}
