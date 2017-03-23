export function showLoginDialog () {
  return {
    type: 'SHOW_LOGIN',
    payload: {
    },
  }
}

export function toggleOptions () {
  return {
    type: 'TOGGLE_OPTIONS',
    payload: {
    },
  }
}

export function selectVmDetail ({ vmId }) {
  return {
    type: 'SELECT_VM_DETAIL',
    payload: {
      vmId,
    },
  }
}

export function setVmDetailToShow ({ vmId }) {
  return {
    type: 'SET_VM_DETAIL_TO_SHOW',
    payload: {
      vmId,
    },
  }
}

export function closeDetail () {
  return {
    type: 'CLOSE_DETAIL',
    payload: {
    },
  }
}
