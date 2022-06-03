import React from 'react'
import PropTypes from 'prop-types'

import { Col } from '_/components/Grid'
import { InfoTooltip, Tooltip } from '_/components/tooltips'
import { FormGroup } from '@patternfly/react-core'
import classnames from 'classnames'

import style from './style.css'
import gridStyle from '_/components/Grid/style.css'

const FieldRow = ({ label, children, id, tooltip, tooltipPosition, validationState = 'default', useFormGroup }) => (
  <div className={classnames(gridStyle['grid-row'], style['field-row'])}>
    <Col cols={5} className={style['col-label']}>
      {label}
      {tooltip && (
        <span className={style.tooltip}>
          <InfoTooltip
            id={`${id}-tooltip`}
            tooltip={tooltip}
            placement={tooltipPosition}
          />
        </span>
      )}
    </Col>
    <Col cols={7} className={style['col-data']} id={id}>
      {useFormGroup && (
        <FormGroup validated={validationState} className={style.maxWidth100}>
          {children}
        </FormGroup>
      )}
      {!useFormGroup && children}
    </Col>
  </div>
)
FieldRow.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.oneOfType([Tooltip.propTypes.tooltip]),
  children: PropTypes.node.isRequired,
  tooltipPosition: Tooltip.propTypes.placement,
  validationState: PropTypes.oneOf(['success', 'warning', 'error', 'default']),
  useFormGroup: PropTypes.bool,
}

export default FieldRow
