import React from 'react'
import PropTypes from 'prop-types'

import style from './style.css'

const ChangesList = ({ changes = [], translatedLabels = [] }) => {
  // start with translated labels to preserve the order of sections/fields
  const filteredSectionTree = translatedLabels
    .filter(({ fieldName }) => changes.find(changeName => changeName === fieldName))
    // group fields by section (keep the order of sections)
    // output { "some section": ["field A", "field B", ...], ...}
    .reduce((acc, { fieldTitle, sectionTitle }) => {
      if (acc[sectionTitle]) {
        acc[sectionTitle].push(fieldTitle)
      } else {
        acc[sectionTitle] = [fieldTitle]
      }
      return acc
    }, {})

  return (
    <ul className={style['section-list']}>
      {
        Object.entries(filteredSectionTree)
          .map(([sectionTitle, fields]) => (
            <li key={sectionTitle}>
              {sectionTitle}
              <ul className={style['field-list']}>
                { fields.map(fieldTitle => <li key={fieldTitle}>{fieldTitle}</li>)}
              </ul>
            </li>
          ))
      }
    </ul>
  )
}

ChangesList.propTypes = {
  changes: PropTypes.array,
  translatedLabels: PropTypes.array.isRequired,
}

export default ChangesList
