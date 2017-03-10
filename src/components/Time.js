import React, { PropTypes } from 'react'

import { formatTwoDigits } from '../helpers'

const Time = ({ time }) => {
  const t = new Date(time)
  return (
    <div>
      {`${formatTwoDigits(t.getHours())}:${formatTwoDigits(t.getMinutes())}:${formatTwoDigits(t.getSeconds())}`}
    </div>
  )
}
Time.propTypes = {
  time: PropTypes.number.isRequired,
}

export default Time
