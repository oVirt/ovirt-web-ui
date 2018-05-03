const states = {
  start: ['down', 'paused', 'suspended'],
  shutdown: ['up', 'migrating', 'reboot_in_progress', 'paused', 'powering_up', 'powering_down', 'not_responding'],
  restart: ['up', 'migrating'],
  suspend: ['up'],
  console: ['up', 'powering_up', 'powering_down', 'paused', 'migrating', 'reboot_in_progress', 'saving_state'],
  remove: ['down'],
}

export function canStart (state) {
  return state && states.start.indexOf(state) > -1
}

export function canShutdown (state) {
  return state && states.shutdown.indexOf(state) > -1
}

export function canRestart (state) {
  return state && states.restart.indexOf(state) > -1
}

export function canSuspend (state) {
  return state && states.suspend.indexOf(state) > -1
}

export function canConsole (state) {
  return state && states.console.indexOf(state) > -1
}

export function canRemove (state) {
  return state && states.remove.indexOf(state) > -1
}
