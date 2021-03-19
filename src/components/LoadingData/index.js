import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withMsg } from '_/intl'

import { Spinner } from 'patternfly-react'

import style from './style.css'

const LOADING_GRACE_PERIOD_TO_RENDER_MS = 500

/**
 * The user is informed about communication with server when
 * - data is being initially loaded
 * - waiting for an action
 * - load after Refresh button
 * - refreshing data when VM detail is opened
 *
 * Regular polling does not lead to rendering this "Loading ..." message.
 */
class LoadingData extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      activeTimer: null,
      shouldDisplay: false,
    }

    this.setupTimer = this.setupTimer.bind(this)
    this.cancelTimer = this.cancelTimer.bind(this)

    if (props.requestActive) {
      this.setupTimer()
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const newRequestActive = this.props.requestActive

    if (prevProps.requestActive && !newRequestActive) {
      this.cancelTimer()
    }

    if (!prevProps.requestActive && newRequestActive) {
      this.setupTimer()
    }
  }

  setupTimer () {
    const timerId = window.setTimeout(() => {
      this.setState({
        activeTimer: null,
        shouldDisplay: this.props.requestActive,
      })
    }, LOADING_GRACE_PERIOD_TO_RENDER_MS)

    this.setState({
      activeTimer: timerId,
      shouldDisplay: false,
    })
  }

  cancelTimer () {
    const timerId = this.state.activeTimer
    if (timerId) window.clearTimeout(timerId)

    this.setState({
      activeTimer: null,
      shouldDisplay: false,
    })
  }

  render () {
    const { msg } = this.props
    if (!this.state.shouldDisplay) {
      return null
    }

    return (
      <div className={this.props.inline ? style['loading-data-container-inline'] : style['loading-data-container-fixed']}>

        <Spinner loading inline size='md' />

        <div className={style['loading-data-message']}>
          {msg.loadingTripleDot()}
        </div>
      </div>
    )
  }
}

LoadingData.propTypes = {
  requestActive: PropTypes.bool.isRequired,
  inline: PropTypes.bool,
  msg: PropTypes.object,
}
LoadingData.defaultProps = {
  inline: false,
}

export default connect(
  (state) => ({
    requestActive: !state.activeRequests.isEmpty(),
  })
)(withMsg(LoadingData))
