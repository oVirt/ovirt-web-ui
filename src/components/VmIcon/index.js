import React from 'react'
import PropTypes from 'prop-types'
import style from './style.css'

import { BirthdayCakeIcon } from '@patternfly/react-icons/dist/esm/icons'

/**
 * Large or small icon (image) associated with the VM
 * or default when icon not provided
 */

const VmIcon = ({ icon: { data, type } = {}, className }) => {
  if (data) {
    const src = `data:${type};base64,${data}`
    return <img src={src} className={`${style.icon} ${className}`} alt='' />
  }

  return <BirthdayCakeIcon/>
}

VmIcon.propTypes = {
  icon: PropTypes.object, // see the 'icons' reducer
  className: PropTypes.string, // either card-pf-icon or vm-detail-icon
}

export default VmIcon
