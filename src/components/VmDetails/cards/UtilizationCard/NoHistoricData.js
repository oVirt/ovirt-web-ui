import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Icon } from 'patternfly-react'
import { MsgContext } from '_/intl'

import style from './style.css'

/*
 * Replaces a `SparklineChart` in the Charts cards when historic data isn't available.
 */
const NoHistoricData = ({ message, id }) => {
  const { msg } = useContext(MsgContext)
  return (
    <div className={style['no-history-chart']} id={id}>
      <div className={style['no-history-chart-icon']}>
        <Icon type='pf' name='info' />
      </div>
      <div className={style['no-history-chart-message']}>
        { message || msg.utilizationNoHistoricData() }
      </div>
    </div>
  )
}
NoHistoricData.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.string,
}

export default NoHistoricData
