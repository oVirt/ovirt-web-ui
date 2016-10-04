export function logDebug (msg) {
  console.log(msg)
}

export function * foreach (array, fn, context) {
  var i = 0
  var length = array.length

  for (;i < length; i++) {
    yield * fn.call(context, array[i], i, array)
  }
}

export function hidePassword ({action, param}) {
  if (action) {
    if (action['payload'] && action.payload['credentials'] && action.payload.credentials['password']) {
      const hidden = JSON.parse(JSON.stringify(action))
      hidden.payload.credentials.password = '*****'
      return hidden
    }
    return action
  }

  if (param) {
    if (param['password']) {
      const hidden = JSON.parse(JSON.stringify(param))
      hidden.password = '*****'
      return hidden
    }
    return param
  }

  return action
}

export function formatTwoDigits (num) {
  return String("0" + num).slice(-2)
}
// ---------------------------------
// TODO: review - use VM status functions similar to the ovirt-engine
export function canStart (state) {
  return state && state === 'down'
}

// TODO: review
export function canShutdown (state) {
  return canRestart(state)
}

// TODO: review
export function canRestart (state) {
  return state && (state === 'up' || state === 'powering_up' || state === 'paused')
}

// TODO: review
export function canConsole (state) {
  return canRestart(state)
}
/*
 public enum VmStatus {
 UNASSIGNED,
 DOWN,
 UP,
 POWERING_UP,
 PAUSED,
 MIGRATING,
 UNKNOWN,
 NOT_RESPONDING,
 WAIT_FOR_LAUNCH,
 REBOOT_IN_PROGRESS,
 SAVING_STATE,
 RESTORING_STATE,
 SUSPENDED,
 IMAGE_LOCKED,
 POWERING_DOWN;
 }
 */
// --- Data Translation ------------
