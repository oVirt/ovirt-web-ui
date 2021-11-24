import React from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardBody,
  CardTitle,
  FormGroup,
  Hint,
  HintBody,
} from '@patternfly/react-core'
import { InfoTooltip } from '_/components/tooltips'

import style from './style.css'

const Section = ({ name, section, className }) => (
  <Card className={className}>
    <CardTitle>
      <a id={name} />
      {section.title}
      { section.tooltip && <InfoTooltip id={`${name}-info-tooltip`} tooltip={section.tooltip} /> }
    </CardTitle>
    { section.hint && (
      <CardBody key={`${name}-hint`}>
        <Hint>
          <HintBody>{section.hint}</HintBody>
        </Hint>
      </CardBody>
    )}
    { section.fields.map((field) => (
      <CardBody key={field.key}>
        { field.title && (
          <FormGroup
            label={field.title}
            labelIcon={field.tooltip && <InfoTooltip tooltip={field.tooltip} id={`${name}-${field.key}-info-tooltip`} /> }
            fieldId={field.fieldId}
          >
            {field.body}
          </FormGroup>
        )}

        {!field.title && field.body}

        { !field.title && field.tooltip && <InfoTooltip tooltip={field.tooltip} id={`${name}-${field.key}-info-tooltip`} /> }
      </CardBody>
    )) }
  </Card>
)

Section.propTypes = {
  name: PropTypes.string.isRequired,
  section: PropTypes.object.isRequired,
  className: PropTypes.string,
}

const SettingsBase = ({ name, section }) => {
  const sections = section.sections ? Object.entries(section.sections) : [[name, section]]
  return (
    <div className={style['search-content-box']}>
      { sections.map(([name, section]) => (
        <Section key={name} name={name} section={section} className={style['main-content']}/>
      )
      )}
    </div>
  )
}
SettingsBase.propTypes = {
  section: PropTypes.shape({
    sections: PropTypes.objectOf(PropTypes.shape({
      title: PropTypes.string,
      tooltip: PropTypes.string,
      fields: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string,
        tooltip: PropTypes.string,
        key: PropTypes.string,
        body: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        fieldId: PropTypes.string,
      })),
    })),
    title: PropTypes.string,
    tooltip: PropTypes.string,
    fields: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string,
      tooltip: PropTypes.string,
      key: PropTypes.string,
      body: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      fieldId: PropTypes.string,
    })),

  }).isRequired,
  name: PropTypes.string.isRequired,
}

export default SettingsBase
