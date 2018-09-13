import PropTypes from 'prop-types'

const RethrowSagaErrorAsReactError = (errorBridge) => {
  const errorHandler = (error) => {
    throw error
  }
  errorBridge.setErrorHandler(errorHandler())
  return null
}

RethrowSagaErrorAsReactError.propTypes = {
  errorBridge: PropTypes.object.isRequired,
}

export default RethrowSagaErrorAsReactError
