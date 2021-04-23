import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { Icon } from 'patternfly-react'

import { MsgContext } from '_/intl'
import style from './style.css'
import { Tooltip } from '_/components/tooltips'

const diskStateSettings = (msg) => ({
  'active': {
    type: 'fa',
    name: 'arrow-circle-o-up',
    className: style['state-icon-active'],
    tooltip: msg.diskTooltipStatusMessage({ statusInfo: msg.diskStateActiveTooltip() }),
  },
  'inactive': {
    type: 'fa',
    name: 'arrow-circle-o-down',
    className: style['state-icon-inactive'],
    tooltip: msg.diskTooltipStatusMessage({ statusInfo: msg.diskStateInactiveTooltip() }),
  },
  'locked': {
    type: 'pf',
    name: 'locked',
    className: style['state-icon-locked'],
    tooltip: msg.diskTooltipStatusMessage({ statusInfo: msg.diskStateLockedTooltip() }),
  },
})

const DiskStateIcon = ({ idPrefix, diskState, showTooltip = true }) => {
  const { msg } = useContext(MsgContext)
  const diskInfo = diskStateSettings(msg)[diskState]
  const theIcon =
    <Icon
      id={`${idPrefix}-state-icon`}
      type={diskInfo.type}
      name={diskInfo.name}
      className={`${style['state-icon']} ${diskInfo.className}`}
    />

  if (showTooltip) {
    return <Tooltip id={`${idPrefix}-state-icon-tooltip`} tooltip={diskInfo.tooltip}>
      {theIcon}
    </Tooltip>
  }
  return theIcon
}
DiskStateIcon.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  diskState: PropTypes.oneOf([ 'active', 'inactive', 'locked' ]),
  showTooltip: PropTypes.bool,
}

export default DiskStateIcon
