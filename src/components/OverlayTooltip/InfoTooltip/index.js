import React from 'react'
import PropTypes from 'prop-types'
import OverlayTooltip from '../'
import { InfoCircleIcon } from '@patternfly/react-icons'
import style from './style.css'
import { requiredTooltipPropType, tooltipPositionPropType } from '_/propTypeShapes'

const InfoToolTip = ({ id, tooltip, placement, ...rest }) => (
  <OverlayTooltip
    id={id}
    tooltip={tooltip}
    {...rest}
    placement={placement || 'top'}
  >
    <InfoCircleIcon className={style['info-circle-icon']} />
  </OverlayTooltip>
)

InfoToolTip.propTypes = {
  id: PropTypes.string.isRequired,
  tooltip: requiredTooltipPropType,
  placement: tooltipPositionPropType,
}

export default InfoToolTip
