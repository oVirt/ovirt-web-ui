import React from 'react'
import PropTypes from 'prop-types'

const ErrorAlert = ({ id, message, children }) => {
  return (
    <div className='alert error-alert alert-danger'>
      <span className='pficon pficon-error-circle-o' />
      <span id={id}>
        {message && (<strong>{message}</strong>)}
        {children}
      </span>
    </div>
  )
}
ErrorAlert.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.string,
  children: PropTypes.node,
}

export default ErrorAlert
