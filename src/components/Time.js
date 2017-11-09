import React from 'react'
import PropTypes from 'prop-types'

import { formatTwoDigits } from '../helpers'

const Time = ({ time, cssClass, id }) => {
  const t = new Date(time)
  return (
    <div className={cssClass} id={id}>
      {`${formatTwoDigits(t.getHours())}:${formatTwoDigits(t.getMinutes())}:${formatTwoDigits(t.getSeconds())}`}
    </div>
  )
}
Time.propTypes = {
  time: PropTypes.number.isRequired,
  cssClass: PropTypes.string,
  id: PropTypes.string,
}

export default Time
