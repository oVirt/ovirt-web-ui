import { REDIRECT } from '../constants'

export function redirectRoute ({ route }) {
  return {
    type: REDIRECT,
    payload: {
      route,
    },
  }
}
