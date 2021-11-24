import React from 'react'
import PropTypes from 'prop-types'

import style from './style.css'

const UtilizationCardData = ({ available, line1, line2, idPrefix }) => {
  return (
    <p className={style['utilization-card-details']}>
      <span id={`${idPrefix}-available`} className={style['utilization-card-details-count']}>{available}</span>
      <span className={style['utilization-card-details-description']}>
        <span className={style['utilization-card-details-line-1']}>{line1}</span>
        <span>{line2}</span>
      </span>
    </p>
  )
}

UtilizationCardData.propTypes = {
  idPrefix: PropTypes.string,
  available: PropTypes.string,
  line1: PropTypes.string,
  line2: PropTypes.string,
}

export default UtilizationCardData
