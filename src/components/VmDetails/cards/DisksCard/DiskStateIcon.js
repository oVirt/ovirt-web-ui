import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { MsgContext } from '_/intl'
import style from './style.css'
import { Tooltip } from '_/components/tooltips'
import { ArrowCircleUpIcon, ArrowCircleDownIcon, LockIcon, UnknownIcon } from '@patternfly/react-icons/dist/esm/icons'

const diskStateSettings = (msg) => ({
  active: {
    Icon: ArrowCircleUpIcon,
    className: style['state-icon-active'],
    tooltip: msg.diskTooltipStatusMessage({ statusInfo: msg.diskStateActiveTooltip() }),
  },
  inactive: {
    Icon: ArrowCircleDownIcon,
    className: style['state-icon-inactive'],
    tooltip: msg.diskTooltipStatusMessage({ statusInfo: msg.diskStateInactiveTooltip() }),
  },
  locked: {
    Icon: LockIcon,
    className: style['state-icon-locked'],
    tooltip: msg.diskTooltipStatusMessage({ statusInfo: msg.diskStateLockedTooltip() }),
  },
})

const DiskStateIcon = ({ idPrefix, diskState, showTooltip = true }) => {
  const { msg } = useContext(MsgContext)
  const id = `${idPrefix}-state-icon`
  const {
    Icon,
    className: iconStyle,
    tooltip,
  } = diskStateSettings(msg)[diskState] || { Icon: UnknownIcon, className: '' }

  const theIcon = <Icon id={id} className={`${style['state-icon']} ${iconStyle}`}/>

  if (showTooltip) {
    return (
      <Tooltip id={`${idPrefix}-state-icon-tooltip`} tooltip={tooltip}>
        {theIcon}
      </Tooltip>
    )
  }
  return theIcon
}
DiskStateIcon.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  diskState: PropTypes.oneOf(['active', 'inactive', 'locked']),
  showTooltip: PropTypes.bool,
}

export default DiskStateIcon
