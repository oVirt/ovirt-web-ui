import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { MsgContext } from '_/intl'
import style from './style.css'
import { Tooltip } from '_/components/tooltips'
import { ArrowCircleUpIcon, ArrowCircleDownIcon, LockIcon, UnknownIcon } from '@patternfly/react-icons/dist/esm/icons'

const diskStateSettings = (msg) => ({
  active: msg.diskTooltipStatusMessage({ statusInfo: msg.diskStateActiveTooltip() }),
  inactive: msg.diskTooltipStatusMessage({ statusInfo: msg.diskStateInactiveTooltip() }),
  locked: msg.diskTooltipStatusMessage({ statusInfo: msg.diskStateLockedTooltip() }),
})

const DiskStateIcon = ({ idPrefix, diskState, showTooltip = true }) => {
  const { msg } = useContext(MsgContext)
  const id = `${idPrefix}-state-icon`
  const [Icon, iconStyle] = diskState === 'active'
    ? [ArrowCircleUpIcon, style['state-icon-active']]
    : diskState === 'inactive'
      ? [ArrowCircleDownIcon, style['state-icon-inactive']]
      : diskState === 'locked'
        ? [LockIcon, style['state-icon-locked']]
        : [UnknownIcon, '']

  const theIcon = <Icon id={id} className={`${style['state-icon']} ${iconStyle}`}/>

  if (showTooltip) {
    return (
      <Tooltip id={`${idPrefix}-state-icon-tooltip`} tooltip={diskStateSettings(msg)[diskState]}>
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
