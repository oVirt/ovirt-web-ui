import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { Icon } from 'patternfly-react'

import { MsgContext } from '_/intl'
import style from './style.css'
import { Tooltip } from '_/components/tooltips'

const nicLinkInfoSettings = (msg) => ({
  true: {
    type: 'fa',
    name: 'arrow-circle-o-up',
    className: style['link-icon-up'],
    tooltip: msg.nicLinkStatusUp(),
  },
  false: {
    type: 'fa',
    name: 'arrow-circle-o-down',
    className: style['link-icon-down'],
    tooltip: msg.nicLinkStatusDown(),
  },
})

const NicLinkStateIcon = ({ linkState = false, showTooltip = true, idSuffix }) => {
  const { msg } = useContext(MsgContext)
  const linkInfo = nicLinkInfoSettings(msg)[linkState]
  const theIcon =
    <Icon
      id={`nic-link-icon-${idSuffix || linkState}`}
      type={linkInfo.type}
      name={linkInfo.name}
      className={`${style['link-icon']} ${linkInfo.className}`}
    />

  if (showTooltip) {
    return <Tooltip id={`nic-link-icon-tooltip-${idSuffix || linkState}`} tooltip={linkInfo.tooltip}>
      {theIcon}
    </Tooltip>
  }

  return theIcon
}
NicLinkStateIcon.propTypes = {
  linkState: PropTypes.bool,
  showTooltip: PropTypes.bool,
  idSuffix: PropTypes.string,
}

export default NicLinkStateIcon
