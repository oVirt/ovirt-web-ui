import React from 'react'
import PropTypes from 'prop-types'

const ErrorAlert = ({ message }) => {
  return message ? (
    <div className='alert alert-danger'>
      <span className='pficon pficon-error-circle-o' />
      <strong>{message}</strong>
    </div>
  ) : null
}
ErrorAlert.propTypes = {
  message: PropTypes.string,
}

export default ErrorAlert
