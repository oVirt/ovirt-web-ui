import {
  CLEAR_USER_MSGS,
  SET_USERMSG_NOTIFIED,
} from '../constants'

export function clearUserMessages () {
  return {
    type: CLEAR_USER_MSGS,
    payload: {},
  }
}

export function setNotificationNotified ({ time }) {
  return {
    type: SET_USERMSG_NOTIFIED,
    payload: {
      time,
    },
  }
}
