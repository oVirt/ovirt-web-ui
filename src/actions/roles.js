import {
  GET_ROLES,
  SET_ROLES,
} from '_/constants'

export function setRoles (roles) {
  return {
    type: SET_ROLES,
    payload: {
      roles,
    },
  }
}

export function getRoles () {
  return {
    type: GET_ROLES,
    payload: {},
  }
}
