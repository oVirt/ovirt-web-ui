export function redirectRoute ({ route }) {
  return {
    type: 'REDIRECT',
    payload: {
      route,
    },
  }
}
