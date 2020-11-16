import React from 'react'
import PropTypes from 'prop-types'
import { OverlayTrigger, Tooltip as PFTooltip } from 'patternfly-react'

const Tooltip = ({ id, tooltip, placement, children, ...rest }) => {
  return (
    <OverlayTrigger
      overlay={
        <PFTooltip id={id}>{tooltip}</PFTooltip>
      }
      placement={placement || 'top'}
      {...rest}
    >
      { children }
    </OverlayTrigger>
  )
}
Tooltip.propTypes = {
  id: PropTypes.string.isRequired,
  tooltip: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  placement: PropTypes.oneOf(['top', 'right', 'bottom', 'left', false]),
  children: PropTypes.node.isRequired,
}

export default Tooltip
