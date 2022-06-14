import React from 'react'
import PropTypes from 'prop-types'
import { ExclamationTriangleIcon, ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons'

export const EventStatus = ({ severity }) => {
  switch (severity) {
    case 'error':
      return <ExclamationCircleIcon color='#c9190b'/>
    case 'warning':
      return <ExclamationTriangleIcon color='#f0ab00'/>
    default:
      return null
  }
}

EventStatus.propTypes = {
  severity: PropTypes.oneOf(['error', 'warning', 'normal']),
}
