import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { Icon } from 'patternfly-react'
import style from './style.css'
import { Tooltip } from '_/components/tooltips'
import { MsgContext } from '_/intl'

/* eslint-disable key-spacing, no-multi-spaces */
const VM_STATUS_TO_ICON = (msg) => ({
  'up'                : { type: 'pf', name: 'on-running',         tooltip: msg.vmStatusIconTooltipUp(), className: style['green'] },
  'powering_up'       : { type: 'pf', name: 'in-progress',        tooltip: msg.vmStatusIconTooltipPoweringUp() },
  'down'              : { type: 'pf', name: 'off',                tooltip: msg.vmStatusIconTooltipDown() },
  'paused'            : { type: 'pf', name: 'paused',             tooltip: msg.vmStatusIconTooltipPaused() },
  'suspended'         : { type: 'pf', name: 'asleep',             tooltip: msg.vmStatusIconTooltipSuspended() },
  'powering_down'     : { type: 'pf', name: 'in-progress',        tooltip: msg.vmStatusIconTooltipPoweringDown() },
  'not_responding'    : { type: 'pf', name: 'warning-triangle-o', tooltip: msg.vmStatusIconTooltipNotResponding() },
  'unknown'           : { type: 'pf', name: 'unknown',            tooltip: msg.vmStatusIconTooltipUnknown() },
  'unassigned'        : { type: 'pf', name: 'unknown',            tooltip: msg.vmStatusIconTooltipUnassigned() },
  'migrating'         : { type: 'pf', name: 'migration',          tooltip: msg.vmStatusIconTooltipMigrating() },
  'wait_for_launch'   : { type: 'pf', name: 'pending',            tooltip: msg.vmStatusIconTooltipWaitForLaunch() },
  'reboot_in_progress': { type: 'pf', name: 'in-progress',        tooltip: msg.vmStatusIconTooltipRebootInProgress() },
  'saving_state'      : { type: 'pf', name: 'pending',            tooltip: msg.vmStatusIconTooltipSavingState() },
  'restoring_state'   : { type: 'pf', name: 'in-progress',        tooltip: msg.vmStatusIconTooltipRestoringState() },
  'image_locked'      : { type: 'pf', name: 'locked',             tooltip: msg.vmStatusIconTooltipImageLocked() },

  '__default__'       : { type: 'pf', name: 'zone',               tooltip: msg.vmStatusIconTooltipDefault() },
})
/* eslint-enable key-spacing, no-multi-spaces */

/**
 * Status-dependent icon for a VM
 */
const VmStatusIcon = ({ id, status, className = undefined }) => {
  const { msg } = useContext(MsgContext)
  const iconData = VM_STATUS_TO_ICON(msg)[status] || VM_STATUS_TO_ICON(msg).__default__
  const classNames =
    iconData.className && className ? `${iconData.className} ${className}`
      : iconData.className && !className ? `${iconData.className}`
        : !iconData.className && className ? `${className}`
          : undefined

  return <Tooltip id={id} tooltip={iconData.tooltip} placement={'bottom'}>
    <Icon type={iconData.type} name={iconData.name} className={classNames} />
  </Tooltip>
}
VmStatusIcon.propTypes = {
  id: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  className: PropTypes.string,
}

export default VmStatusIcon
