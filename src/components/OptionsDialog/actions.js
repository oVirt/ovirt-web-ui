import { SET_SSH_KEY, GET_SSH_KEY, SAVE_SSH_KEY, SET_UNLOADED } from './constants'

export function setSSHKey ({ key, id }) {
  return {
    type: SET_SSH_KEY,
    payload: {
      key,
      id,
    },
  }
}

export function saveSSHKey ({ key, userId, sshId }) {
  return {
    type: SAVE_SSH_KEY,
    payload: {
      key,
      userId,
      sshId,
    },
  }
}

export function getSSHKey ({ userId }) {
  return {
    type: GET_SSH_KEY,
    payload: {
      userId,
    },
  }
}

export function setUnloaded () {
  return { type: SET_UNLOADED }
}
