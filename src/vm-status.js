export function canStart (state) {
  return ['down', 'paused', 'suspended'].includes(state)
}

export function canShutdown (state) {
  return ['up', 'migrating', 'reboot_in_progress', 'paused', 'powering_up', 'powering_down', 'not_responding', 'suspended'].includes(state)
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

export function canChangeCluster (state) {
  return ['down'].includes(state)
}

export function canChangeCd (state) {
  return ['up'].includes(state)
}

export function canDeleteDisk (state) {
  return ['down'].includes(state)
}

export function canExternalService (state, fqdn) {
  return fqdn ? canRestart(state) : false
}

/* eslint-disable key-spacing, no-multi-spaces */
export const statusToTooltipId = {
  up                : { id: 'vmStatusIconTooltipUp' },
  powering_up       : { id: 'vmStatusIconTooltipPoweringUp' },
  down              : { id: 'vmStatusIconTooltipDown' },
  paused            : { id: 'vmStatusIconTooltipPaused' },
  suspended         : { id: 'vmStatusIconTooltipSuspended' },
  powering_down     : { id: 'vmStatusIconTooltipPoweringDown' },
  not_responding    : { id: 'vmStatusIconTooltipNotResponding' },
  unknown           : { id: 'vmStatusIconTooltipUnknown' },
  unassigned        : { id: 'vmStatusIconTooltipUnassigned' },
  migrating         : { id: 'vmStatusIconTooltipMigrating' },
  wait_for_launch   : { id: 'vmStatusIconTooltipWaitForLaunch' },
  reboot_in_progress: { id: 'vmStatusIconTooltipRebootInProgress' },
  saving_state      : { id: 'vmStatusIconTooltipSavingState' },
  restoring_state   : { id: 'vmStatusIconTooltipRestoringState' },
  image_locked      : { id: 'vmStatusIconTooltipImageLocked' },

  __default__       : { id: 'vmStatusIconTooltipDefault' },
}
/* eslint-enable key-spacing, no-multi-spaces */
