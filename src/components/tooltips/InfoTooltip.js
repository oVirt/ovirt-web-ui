import React from 'react'
import PropTypes from 'prop-types'
import Tooltip from './Tooltip'
import { InfoCircleIcon } from '@patternfly/react-icons'
import style from './style.css'

const InfoTooltip = ({ id, tooltip, placement, className, ...rest }) => (
  <Tooltip
    id={id}
    tooltip={tooltip}
    {...rest}
    placement={placement || 'top'}
  >
    <InfoCircleIcon className={`${style['info-circle-icon']} ${className || ''}`} />
  </Tooltip>
)

InfoTooltip.propTypes = {
  id: PropTypes.string.isRequired,
  tooltip: Tooltip.propTypes.tooltip,
  placement: Tooltip.propTypes.placement,
  className: PropTypes.string,
}

export default InfoTooltip
