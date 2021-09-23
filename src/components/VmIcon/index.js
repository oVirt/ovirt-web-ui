import React from 'react'
import PropTypes from 'prop-types'
import style from './style.css'

/**
 * Large or small icon (image) associated with the VM
 * or default when icon not provided
 */

const VmIcon = ({ icon: { data, type } = {}, className, missingIconClassName }) => {
  if (data) {
    const src = `data:${type};base64,${data}`
    return <img src={src} className={`${style.icon} ${className}`} alt='' />
  }

  return <span className={missingIconClassName} />
}

VmIcon.propTypes = {
  icon: PropTypes.object, // see the 'icons' reducer
  className: PropTypes.string, // either card-pf-icon or vm-detail-icon
  missingIconClassName: PropTypes.string.isRequired,
}

export default VmIcon
