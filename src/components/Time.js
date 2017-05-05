import React from 'react'
import PropTypes from 'prop-types'

import { formatTwoDigits } from '../helpers'

const Time = ({ time, cssClass }) => {
  const t = new Date(time)
  return (
    <div className={cssClass}>
      {`${formatTwoDigits(t.getHours())}:${formatTwoDigits(t.getMinutes())}:${formatTwoDigits(t.getSeconds())}`}
    </div>
  )
}
Time.propTypes = {
  time: PropTypes.number.isRequired,
  cssClass: PropTypes.string,
}

export default Time
