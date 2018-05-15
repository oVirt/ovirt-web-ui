export function canStart (state) {
  return ['down', 'paused', 'suspended'].includes(state)
}

export function canShutdown (state) {
  return ['up', 'migrating', 'reboot_in_progress', 'paused', 'powering_up', 'powering_down', 'not_responding'].includes(state)
}

export function canRestart (state) {
  return ['up', 'migrating'].includes(state)
}

export function canSuspend (state) {
  return ['up'].includes(state)
}

export function canConsole (state) {
  return ['up', 'powering_up', 'powering_down', 'paused', 'migrating', 'reboot_in_progress', 'saving_state'].includes(state)
}

export function canRemove (state) {
  return ['down'].includes(state)
}
