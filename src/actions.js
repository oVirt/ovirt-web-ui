export function persistState () {
  return {
    type: 'PERSIST_STATE',
    payload: {
    },
  }
}

export function getSingleVm ({ vmId }) {
  return {
    type: 'GET_VM',
    payload: {
      vmId,
    },
  }
}

export function schedulerOneMinute () {
  return {
    type: 'SCHEDULER__1_MIN',
    payload: {},
  }
}
