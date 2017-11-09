import React from 'react'
import PropTypes from 'prop-types'

const ErrorAlert = ({ message, id }) => {
  return message ? (
    <div className='alert alert-danger'>
      <span className='pficon pficon-error-circle-o' />
      <strong id={id}>{message}</strong>
    </div>
  ) : null
}
ErrorAlert.propTypes = {
  message: PropTypes.string,
  id: PropTypes.string,
}

export default ErrorAlert
