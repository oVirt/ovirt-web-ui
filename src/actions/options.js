import {
  GET_CONSOLE_OPTIONS,
  SAVE_CONSOLE_OPTIONS,
  SET_CONSOLE_OPTIONS,
} from 'app-constants'

export function setConsoleOptions ({ vmId, options }) {
  return {
    type: SET_CONSOLE_OPTIONS,
    payload: {
      vmId,
      options,
    },
  }
}

export function getConsoleOptions ({ vmId }) {
  return {
    type: GET_CONSOLE_OPTIONS,
    payload: {
      vmId,
    },
  }
}

export function saveConsoleOptions ({ vmId, options }) {
  return {
    type: SAVE_CONSOLE_OPTIONS,
    payload: {
      vmId,
      options,
    },
  }
}
