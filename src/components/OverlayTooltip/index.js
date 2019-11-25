import React from 'react'
import PropTypes from 'prop-types'
import { OverlayTrigger, Tooltip } from 'patternfly-react'

const OverlayTooltip = ({ id, tooltip, placement = 'top', children, ...rest }) => {
  return (
    <OverlayTrigger
      overlay={
        <Tooltip id={id}>{tooltip}</Tooltip>
      }
      placement={placement}
      {...rest}
    >
      { children }
    </OverlayTrigger>
  )
}
OverlayTooltip.propTypes = {
  id: PropTypes.string.isRequired,
  tooltip: PropTypes.string.isRequired,
  placement: PropTypes.string,
  children: PropTypes.node.isRequired,
}

export default OverlayTooltip
