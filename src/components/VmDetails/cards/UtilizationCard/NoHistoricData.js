import React from 'react'
import PropTypes from 'prop-types'
import { Icon } from 'patternfly-react'

import style from './style.css'

/*
 * Replaces a `SparklineChart` in the Charts cards when historic data isn't available.
 */
const NoHistoricData = ({ message, id }) => (
  <div className={style['no-history-chart']} id={id}>
    <div className={style['no-history-chart-icon']}>
      <Icon type='pf' name='info' />
    </div>
    <div className={style['no-history-chart-message']}>
      { message || 'No historic data available' }
    </div>
  </div>
)
NoHistoricData.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.string,
}

export default NoHistoricData
