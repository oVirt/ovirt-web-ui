import {
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
