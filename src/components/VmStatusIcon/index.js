import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { Icon } from 'patternfly-react'
import style from './style.css'
import { Tooltip } from '_/components/tooltips'
import { MsgContext } from '_/intl'
import { statusToTooltipId } from '_/vm-status'

import { translate } from '_/helpers'

/* eslint-disable key-spacing, no-multi-spaces */
const VM_STATUS_TO_ICON = (msg) => ({
  up                : { type: 'pf', name: 'on-running',        className: style.green },
  powering_up       : { type: 'pf', name: 'in-progress'        },
  down              : { type: 'pf', name: 'off'                },
  paused            : { type: 'pf', name: 'paused'             },
  suspended         : { type: 'pf', name: 'asleep'             },
  powering_down     : { type: 'pf', name: 'in-progress'        },
  not_responding    : { type: 'pf', name: 'warning-triangle-o' },
  unknown           : { type: 'pf', name: 'unknown'            },
  unassigned        : { type: 'pf', name: 'unknown'            },
  migrating         : { type: 'pf', name: 'migration'          },
  wait_for_launch   : { type: 'pf', name: 'pending'            },
  reboot_in_progress: { type: 'pf', name: 'in-progress'        },
  saving_state      : { type: 'pf', name: 'pending'            },
  restoring_state   : { type: 'pf', name: 'in-progress'        },
  image_locked      : { type: 'pf', name: 'locked'             },

  __default__       : { type: 'pf', name: 'zone'               },
})
/* eslint-enable key-spacing, no-multi-spaces */

/**
 * Status-dependent icon for a VM
 */
const VmStatusIcon = ({ id, status, className = undefined }) => {
  const { msg } = useContext(MsgContext)
  const iconData = VM_STATUS_TO_ICON(msg)[status] || VM_STATUS_TO_ICON(msg).__default__
  const tooltip = translate({ ...statusToTooltipId[status] ?? status.__default__, msg })
  const classNames =
    iconData.className && className
      ? `${iconData.className} ${className}`
      : iconData.className && !className
        ? `${iconData.className}`
        : !iconData.className && className
          ? `${className}`
          : undefined

  return (
    <Tooltip id={id} tooltip={tooltip} placement={'bottom'}>
      <Icon type={iconData.type} name={iconData.name} className={classNames} />
    </Tooltip>
  )
}
VmStatusIcon.propTypes = {
  id: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  className: PropTypes.string,
}

export default VmStatusIcon
