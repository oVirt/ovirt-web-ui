import React from 'react'
import PropTypes from 'prop-types'

import { Icon, OverlayTrigger, Tooltip } from 'patternfly-react'

import { msg } from '../../../../intl'
import style from './style.css'

const diskStateSettings = {
  'active': {
    type: 'fa',
    name: 'arrow-circle-o-up',
    className: style['state-icon-active'],
    tooltip: msg.diskStateActiveTooltip(),
  },
  'inactive': {
    type: 'fa',
    name: 'arrow-circle-o-down',
    className: style['state-icon-inactive'],
    tooltip: msg.diskStateInactiveTooltip(),
  },
  'locked': {
    type: 'pf',
    name: 'locked',
    className: style['state-icon-locked'],
    tooltip: msg.diskStateLockedTooltip(),
  },

}

const DiskStateIcon = ({ idPrefix, diskState, showTooltip = true }) => {
  const diskInfo = diskStateSettings[diskState]
  const theIcon =
    <Icon
      id={`${idPrefix}-state-icon`}
      type={diskInfo.type}
      name={diskInfo.name}
      className={`${style['state-icon']} ${diskInfo.className}`}
    />

  if (showTooltip) {
    return <OverlayTrigger
      placement='left'
      overlay={
        <Tooltip id={`${idPrefix}-state-icon-tooltip`}>
          {diskInfo.tooltip}
        </Tooltip>
      }
    >
      {theIcon}
    </OverlayTrigger>
  }

  return theIcon
}
DiskStateIcon.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  diskState: PropTypes.oneOf([ 'active', 'inactive', 'locked' ]),
  showTooltip: PropTypes.bool,
}

export default DiskStateIcon
