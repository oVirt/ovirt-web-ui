import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import style from './style.css'
import { Tooltip } from '_/components/tooltips'
import { MsgContext } from '_/intl'
import { statusToTooltipId } from '_/vm-status'

import { translate } from '_/helpers'
import {
  RunningIcon,
  InProgressIcon,
  OffIcon,
  PauseCircleIcon,
  AsleepIcon,
  ExclamationTriangleIcon,
  UnknownIcon,
  MigrationIcon,
  PendingIcon,
  LockIcon,
} from '@patternfly/react-icons/dist/esm/icons'

/* eslint-disable key-spacing, no-multi-spaces */
const VM_STATUS_TO_ICON = {
  up                : { constructor: RunningIcon,        className: style.green },
  powering_up       : { constructor: InProgressIcon      },
  down              : { constructor: OffIcon                },
  paused            : { constructor: PauseCircleIcon             },
  suspended         : { constructor: AsleepIcon             },
  powering_down     : { constructor: InProgressIcon       },
  not_responding    : { constructor: ExclamationTriangleIcon },
  unknown           : { constructor: UnknownIcon            },
  unassigned        : { constructor: UnknownIcon            },
  migrating         : { constructor: MigrationIcon          },
  wait_for_launch   : { constructor: PendingIcon            },
  reboot_in_progress: { constructor: InProgressIcon       },
  saving_state      : { constructor: PendingIcon          },
  restoring_state   : { constructor: InProgressIcon        },
  image_locked      : { constructor: LockIcon             },

  __default__       : { constructor: UnknownIcon               },
}
/* eslint-enable key-spacing, no-multi-spaces */

/**
 * Status-dependent icon for a VM
 */
const VmStatusIcon = ({ id, status, className = undefined }) => {
  const { msg } = useContext(MsgContext)
  const iconData = VM_STATUS_TO_ICON[status] || VM_STATUS_TO_ICON.__default__
  const tooltip = translate({ ...statusToTooltipId[status] ?? status.__default__, msg })
  const classNames =
    iconData.className && className
      ? `${iconData.className} ${className}`
      : iconData.className && !className
        ? `${iconData.className}`
        : !iconData.className && className
          ? `${className}`
          : undefined
  const Icon = iconData.constructor
  return (
    <Tooltip id={id} tooltip={tooltip} placement={'bottom'}>
      <Icon className={classNames} />
    </Tooltip>
  )
}
VmStatusIcon.propTypes = {
  id: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  className: PropTypes.string,
}

export default VmStatusIcon
