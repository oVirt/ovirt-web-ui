import React from 'react'
import PropTypes from 'prop-types'

const ErrorAlert = ({ id, message, dangerouslySetInnerHTML }) => {
  return (
    <div className='alert alert-danger'>
      <span className='pficon pficon-error-circle-o' />
      {message && (
        <strong id={id}>{message}</strong>
      )}
      {dangerouslySetInnerHTML && (
        <span id={id} dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      )}
    </div>
  )
}
ErrorAlert.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.string,
  dangerouslySetInnerHTML: PropTypes.shape({
    __html: PropTypes.any.isRequired,
  }),
}

export default ErrorAlert
