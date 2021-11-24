import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { MsgContext } from '_/intl'
import style from './style.css'
import { Tooltip } from '_/components/tooltips'
import { ArrowCircleUpIcon, ArrowCircleDownIcon } from '@patternfly/react-icons/dist/esm/icons'

const NicLinkStateIcon = ({ linkState = false, showTooltip = true, idSuffix }) => {
  const { msg } = useContext(MsgContext)
  const id = `nic-link-icon-${idSuffix || linkState}`
  const [Icon, iconStyle] = linkState ? [ArrowCircleUpIcon, style['link-icon-up']] : [ArrowCircleDownIcon, style['link-icon-down']]
  const theIcon = <Icon id={id} className={`${style['link-icon']} ${iconStyle}`}/>

  if (showTooltip) {
    return (
      <Tooltip id={`nic-link-icon-tooltip-${idSuffix || linkState}`} tooltip={linkState ? msg.nicLinkStatusUp() : msg.nicLinkStatusDown() }>
        {theIcon}
      </Tooltip>
    )
  }

  return theIcon
}
NicLinkStateIcon.propTypes = {
  linkState: PropTypes.bool,
  showTooltip: PropTypes.bool,
  idSuffix: PropTypes.string,
}

export default NicLinkStateIcon
