import React from 'react'
import PropTypes from 'prop-types'

import { Col } from '_/components/Grid'
import { InfoTooltip, Tooltip } from '_/components/tooltips'
import { FormGroup, ControlLabel } from 'patternfly-react'
import classnames from 'classnames'

import style from './style.css'
import gridStyle from '_/components/Grid/style.css'

const FieldRow = ({ label, children, id, tooltip, tooltipPosition, validationState = null }) => (
  <FormGroup
    className={classnames(gridStyle['grid-row'], style['field-row'])}
    validationState={validationState}
  >
    <Col cols={5} className={style['col-label']}>
      <ControlLabel>{label}</ControlLabel>
      {tooltip &&
        <span className={style['tooltip']}>
          <InfoTooltip
            id={`${id}-tooltip`}
            tooltip={tooltip}
            placement={tooltipPosition}
          />
        </span>
      }
    </Col>
    <Col cols={7} className={style['col-data']} id={id}>{children}</Col>
  </FormGroup>
)
FieldRow.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.oneOfType([ Tooltip.propTypes.tooltip ]),
  children: PropTypes.node.isRequired,
  tooltipPosition: Tooltip.propTypes.placement,
  validationState: FormGroup.propTypes.validationState,
}

export default FieldRow
