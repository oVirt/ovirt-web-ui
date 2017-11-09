import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import ErrorAlert from './ErrorAlert'
import { msg } from '../intl'

// TODO: allow the user to cancel the automatic reload?
// If so, change visibility.isTokenExpired to false and add additional check to doCheckTokenExpired() before actual reload
const TokenExpired = ({ config }) => {
  if (!config.get('isTokenExpired')) {
    return null
  }

  return <ErrorAlert message={msg.authorizationExpired()} id='token-expired' />
}
TokenExpired.propTypes = {
  config: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
  })
)(TokenExpired)
