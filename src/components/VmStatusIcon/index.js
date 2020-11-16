import React from 'react'
import PropTypes from 'prop-types'

import { Icon } from 'patternfly-react'
import style from './style.css'
import { Tooltip } from '_/components/tooltips'

/* eslint-disable key-spacing, no-multi-spaces */
const VM_STATUS_TO_ICON = {
  'up'                : { type: 'pf', name: 'on-running',         tooltip: 'The VM is running.', className: style['green'] },
  'powering_up'       : { type: 'pf', name: 'in-progress',        tooltip: 'The VM is powering up.' },
  'down'              : { type: 'pf', name: 'off',                tooltip: 'The VM is down.' },
  'paused'            : { type: 'pf', name: 'paused',             tooltip: 'The VM is paused.' },
  'suspended'         : { type: 'pf', name: 'asleep',             tooltip: 'The VM is suspended.' },
  'powering_down'     : { type: 'pf', name: 'in-progress',        tooltip: 'The VM is going down.' },
  'not_responding'    : { type: 'pf', name: 'warning-triangle-o', tooltip: 'The VM is not responding.' },
  'unknown'           : { type: 'pf', name: 'unknown',            tooltip: 'The VM status is unknown.' },
  'unassigned'        : { type: 'pf', name: 'unknown',            tooltip: 'The VM status is unassigned.' },
  'migrating'         : { type: 'pf', name: 'migration',          tooltip: 'The VM is being migrated.' },
  'wait_for_launch'   : { type: 'pf', name: 'pending',            tooltip: 'The VM is scheduled for launch.' },
  'reboot_in_progress': { type: 'pf', name: 'in-progress',        tooltip: 'The VM is being rebooted.' },
  'saving_state'      : { type: 'pf', name: 'pending',            tooltip: 'The VM is saving its state.' },
  'restoring_state'   : { type: 'pf', name: 'in-progress',        tooltip: 'The VM is restoring its state.' },
  'image_locked'      : { type: 'pf', name: 'locked',             tooltip: 'The VM\'s image is locked' },

  '__default__'       : { type: 'pf', name: 'zone',               tooltip: 'Unknown/unexpected VM state' },
}
/* eslint-enable key-spacing, no-multi-spaces */

/**
 * Status-dependent icon for a VM
 */
const VmStatusIcon = ({ id, status, className = undefined }) => {
  const iconData = VM_STATUS_TO_ICON[status] || VM_STATUS_TO_ICON.__default__
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
