import React from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  Col,
  ControlLabel,
  FormGroup,
} from 'patternfly-react'
import { InfoTooltip } from '_/components/tooltips'

import style from './style.css'

const LabelCol = ({ children, tooltip, fieldPath, ...props }) => {
  return <Col componentClass={ControlLabel} {...props}>
    { children } { tooltip && <InfoTooltip tooltip={tooltip} id={`${fieldPath}-info-tooltip`} /> }
  </Col>
}
LabelCol.propTypes = {
  children: PropTypes.node.isRequired,
  tooltip: PropTypes.string,
  fieldPath: PropTypes.string,
}

const Item = ({ title, isActive, onClick }) => {
  return <li className={`list-group-item ${isActive && 'active'}`}>
    <a href='#' onClick={(e) => { e.preventDefault(); onClick() }}>
      <span className='list-group-item-value'>{title}</span>
      <div className='badge-container-pf' />
    </a>
  </li>
}

Item.propTypes = {
  title: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
}

const Section = ({ name, section }) => (
  <React.Fragment>
    <h3>
      <a id={name} />
      {section.title}
      { section.tooltip && <InfoTooltip id={`${name}-info-tooltip`} tooltip={section.tooltip} /> }
    </h3>
    { section.fields.map((field) => (
      <FormGroup key={field.title} className={style['settings-field']}>
        <LabelCol fieldPath={`${name}-${field.title}`} tooltip={field.tooltip} sm={3} className={style['field-label']}>
          { field.title }
        </LabelCol>
        <Col sm={9}>
          {field.body}
        </Col>
      </FormGroup>
    )) }
  </React.Fragment>
)

Section.propTypes = {
  name: PropTypes.string.isRequired,
  section: PropTypes.object.isRequired,
}

const SettingsBase = ({ sections }) => {
  const existingSections = Object.entries(sections).filter(([key, section]) => !!section)
  return (
    <div className={style['search-content-box']}>
      { existingSections.map(([key, section]) => (
        <Card key={key} className={style['main-content']}>
          <div className={style['main-content-container']}>
            <Section name={key} section={section} />
          </div>
        </Card>
      ))
      }
    </div>
  )
}
SettingsBase.propTypes = {
  sections: PropTypes.object.isRequired,
}

export default SettingsBase
