import React from 'react'
import PropTypes from 'prop-types'

import { FieldLevelHelp } from 'patternfly-react'
import { Row, Col } from '_/components/Grid'
import style from './style.css'

const FieldRow = ({ label, children, id, tooltip }) => (
  <Row className={style['field-row']}>
    <Col cols={5} className={style['col-label']}>
      <span>{label}</span>
      {tooltip && <FieldLevelHelp buttonClass={style['field-level-help']} disabled={false} content={tooltip} inline />}
    </Col>
    <Col cols={7} className={style['col-data']} id={id}>{children}</Col>
  </Row>
)
FieldRow.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
  children: PropTypes.node.isRequired,
}

export default FieldRow
