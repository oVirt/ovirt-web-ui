import React from 'react'
import PropTypes from 'prop-types'
import { OverlayTrigger, Tooltip } from 'patternfly-react'
import { requiredTooltipPropType, tooltipPositionPropType } from '_/propTypeShapes'

const OverlayTooltip = ({ id, tooltip, placement, children, ...rest }) => {
  return (
    <OverlayTrigger
      overlay={
        <Tooltip id={id}>{tooltip}</Tooltip>
      }
      placement={placement || 'top'}
      {...rest}
    >
      { children }
    </OverlayTrigger>
  )
}
OverlayTooltip.propTypes = {
  id: PropTypes.string.isRequired,
  tooltip: requiredTooltipPropType,
  placement: tooltipPositionPropType,
  children: PropTypes.node.isRequired,
}

export default OverlayTooltip
