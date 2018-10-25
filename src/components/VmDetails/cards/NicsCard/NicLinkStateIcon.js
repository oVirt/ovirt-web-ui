import React from 'react'
import PropTypes from 'prop-types'

import { Icon, OverlayTrigger, Tooltip } from 'patternfly-react'

import { msg } from '../../../../intl'
import style from './style.css'

const nicLinkInfoSettings = {
  true: {
    type: 'fa',
    name: 'arrow-circle-o-up',
    className: style['link-icon-up'],
    tooltip: msg.nicLinkUpTooltip(),
  },
  false: {
    type: 'fa',
    name: 'arrow-circle-o-down',
    className: style['link-icon-down'],
    tooltip: msg.nicLinkDownTooltip(),
  },
}

const NicLinkStateIcon = ({ linkState = false, showTooltip = true, idSuffix }) => {
  const linkInfo = nicLinkInfoSettings[linkState]
  const theIcon =
    <Icon
      id={`nic-link-icon-${idSuffix || linkState}`}
      type={linkInfo.type}
      name={linkInfo.name}
      className={`${style['link-icon']} ${linkInfo.className}`}
    />

  if (showTooltip) {
    return <OverlayTrigger
      placement='left'
      overlay={
        <Tooltip id={`nic-link-icon-tooltip-${idSuffix || linkState}`}>
          {linkInfo.tooltip}
        </Tooltip>
      }
    >
      {theIcon}
    </OverlayTrigger>
  }

  return theIcon
}
NicLinkStateIcon.propTypes = {
  linkState: PropTypes.bool,
  showTooltip: PropTypes.bool,
  idSuffix: PropTypes.string,
}

export default NicLinkStateIcon
