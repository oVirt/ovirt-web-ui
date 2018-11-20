import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import { msg } from '_/intl'
import style from './style.css'

/**
 * The user is informed about communication with server when
 * - data is being initially loaded
 * - waiting for an action
 * - load after Refresh button
 * - refreshing data when VM detail is opened
 *
 * Regular polling does not lead to rendering this "Loading ..." message.
 */
const LoadingData = ({ requestActive }) => {
  if (!requestActive) {
    return null
  }

  return (
    <div className={`alert alert-warning ${style['loading-data']}`}>
      <strong id='load-in-progress'>{msg.loadingTripleDot()}</strong>
    </div>)
}
LoadingData.propTypes = {
  requestActive: PropTypes.bool.isRequired,
}

export default connect(
  (state) => ({
    requestActive: !state.activeRequests.isEmpty(),
  })
)(LoadingData)
