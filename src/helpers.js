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
export function canConsole ({state}) {
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
/**
 * @param vm - Single entry from oVirt REST /api/vms
 * @returns {} - Internal representation of a VM
 */
export function ovirtVmToInternal ({vm}) {
  function vCpusCount({cpu}) {
    if (cpu) {
      let total = cpu['sockets'] ? cpu['sockets'] : 0
      total = total * cpu['cores'] ? cpu['cores'] : 0
      total = total * cpu['threads'] ? cpu['threads'] : 0
      return total
    }
    return 0
  }

  return {
    name: vm['name'],
    id: vm['id'],
    status: vm['status'] ? vm['status'].toLowerCase() : undefined,
    type: vm['type'],

    // TODO: improve time conversion
    startTime: vm['start_time'] ? (new Date(vm['start_time'])).toUTCString() : undefined,
    stopTime: vm['stop_time'] ? (new Date(vm['stop_time'])).toUTCString() : undefined,
    creationTime: vm['creation_time'] ? (new Date(vm['creation_time'])).toUTCString() : undefined,
    startPaused: vm['start_paused'],

    fqdn: vm['fqdn'],

    template: {
      id: vm['template'] ? vm.template['id'] : undefined
    },
    cluster: {
      id: vm['cluster'] ? vm.cluster['id'] : undefined
    },
    cpu: {
      arch: vm['cpu'] ? vm.cpu['architecture'] : undefined,
      vCPUs: vCpusCount({cpu: vm['cpu']})
    },

    memory: {
      total: vm['memory'],
      guaranteed: vm['memory_policy'] ? vm.memory_policy['guaranteed'] : undefined
    },

    os: {
      type: vm['os'] ? vm.os['type'] : undefined
    },

    highAvailability: {
      enabled: vm['high_availability'] ? vm.high_availability['enabled'] : undefined,
      priority: vm['high_availability'] ? vm.high_availability['priority'] : undefined
    },

    icons: {
      small: {
        id: vm['small_icon'] ? vm.small_icon['id'] : undefined
      },
      large: {
        id: vm['large_icon'] ? vm.large_icon['id'] : undefined
      }
    }
  }
}
