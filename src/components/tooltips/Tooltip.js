import React from 'react'
import PropTypes from 'prop-types'
import {
  Tooltip as PFTooltip,
} from '@patternfly/react-core'

const Tooltip = ({ id, tooltip, placement = 'top', children }) => {
  return (
    <PFTooltip id={id} content={tooltip} position={placement || 'top'}>
      { children }
    </PFTooltip>
  )
}
Tooltip.propTypes = {
  id: PropTypes.string.isRequired,
  tooltip: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  placement: PropTypes.oneOf(['top', 'right', 'bottom', 'left', false]),
  children: PropTypes.node.isRequired,
}

export default Tooltip
