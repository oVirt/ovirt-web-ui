import React from 'react'
import PropTypes from 'prop-types'

import { Row, Col } from '_/components/Grid'
import style from './style.css'
import InfoToolTip from '_/components/OverlayTooltip/InfoTooltip'
import { tooltipPropType, tooltipPositionPropType } from '_/propTypeShapes'

const FieldRow = ({ label, children, id, tooltip, tooltipPosition }) => (
  <Row className={style['field-row']}>
    <Col cols={5} className={style['col-label']}>
      <span>{label}</span>
      {tooltip &&
        <span>
          <InfoToolTip
            id={`${id}-tooltip`}
            tooltip={tooltip}
            placement={tooltipPosition}
          />
        </span>
      }
    </Col>
    <Col cols={7} className={style['col-data']} id={id}>{children}</Col>
  </Row>
)
FieldRow.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  tooltip: tooltipPropType,
  children: PropTypes.node.isRequired,
  tooltipPosition: tooltipPositionPropType,
}

export default FieldRow
