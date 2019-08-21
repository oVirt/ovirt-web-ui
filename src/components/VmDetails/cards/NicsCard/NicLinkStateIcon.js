import React from 'react'
import PropTypes from 'prop-types'

import { Icon } from 'patternfly-react'

import { msg } from '_/intl'
import style from './style.css'
import OverlayTooltip from '_/components/OverlayTooltip'

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
    return <OverlayTooltip id={`nic-link-icon-tooltip-${idSuffix || linkState}`} tooltip={linkInfo.tooltip}>
      {theIcon}
    </OverlayTooltip>
  }

  return theIcon
}
NicLinkStateIcon.propTypes = {
  linkState: PropTypes.bool,
  showTooltip: PropTypes.bool,
  idSuffix: PropTypes.string,
}

export default NicLinkStateIcon
