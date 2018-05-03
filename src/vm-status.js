export function canStart (state) {
  return state && (state === 'down' || state === 'paused' || state === 'suspended')
}

export function canShutdown (state) {
  return state && (state === 'up' ||
                   state === 'migrating' ||
                   state === 'reboot_in_progress' ||
                   state === 'paused' ||
                   state === 'powering_up' ||
                   state === 'powering_down' ||
                   state === 'not_responding')
}

export function canRestart (state) {
  return state && (state === 'up' || state === 'migrating')
}

export function canSuspend (state) {
  return state && (state === 'up')
}

export function canConsole (state) {
  return state && (state === 'up' ||
                   state === 'powering_up' ||
                   state === 'powering_down' ||
                   state === 'paused' ||
                   state === 'migrating' ||
                   state === 'reboot_in_progress' ||
                   state === 'saving_state')
}

export function canRemove (state) {
  return state && (state === 'down')
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
