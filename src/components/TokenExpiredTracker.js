import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { SessionTimeout } from 'patternfly-react'

import AppConfiguration from '_/config'
import ErrorAlert from './ErrorAlert'
import { msg } from '_/intl'

import { logout } from '_/actions'

const TIME_TO_DISPLAY_MODAL = 30 // 30 seconds

// TODO: allow the user to cancel the automatic reload?
// If so, change config.isTokenExpired to false and add additional check to doCheckTokenExpired() before actual reload
class TokenExpiredTracker extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showTimeoutModal: false,
      counter: AppConfiguration.maxUserInactiveTimeInSeconds,
    }

    this.dropCounter = this.dropCounter.bind(this)
    this.decrementCounter = this.decrementCounter.bind(this)

    document.body.addEventListener('mousemove', this.dropCounter)
    this.timer = setInterval(this.decrementCounter, 1000)
  }

  dropCounter () {
    if (!this.state.showTimeoutModal) {
      this.setState({ counter: AppConfiguration.maxUserInactiveTimeInSeconds })
    }
  }
  decrementCounter () {
    const state = {
      counter: this.state.counter - 1,
    }
    if (this.state.counter <= TIME_TO_DISPLAY_MODAL && !this.state.showTimeoutModal) {
      state.showTimeoutModal = true
    }
    if (this.state.counter <= 0) {
      this.props.onLogout()
    }
    this.setState(state)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
  }

  render () {
    const { config, onLogout } = this.props
    if (this.state.showTimeoutModal) {
      return <SessionTimeout
        timeLeft={this.state.counter}
        displayBefore={TIME_TO_DISPLAY_MODAL}
        continueFnc={() => this.setState({ showTimeoutModal: false, counter: AppConfiguration.maxUserInactiveTimeInSeconds })}
        logoutFnc={onLogout}
        primaryContent={<p className='lead'>{ msg.sessionExpired() }</p>}
        secondaryContent={
          <React.Fragment>
            <p>{ msg.logOutInSecondsSecondary({ seconds: this.state.counter }) }</p>
            <p>{ msg.continueSessionSecondary() }</p>
          </React.Fragment>
        }
        continueContent={msg.continueSessionBtn()}
        logoutContent={msg.logOut()}
      />
    }
    if (!config.get('isTokenExpired')) {
      return null
    }

    return <ErrorAlert message={msg.authorizationExpired()} id='token-expired' />
  }
}
TokenExpiredTracker.propTypes = {
  config: PropTypes.object.isRequired,
  onLogout: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
  }),
  (dispatch) => ({
    onLogout: () => dispatch(logout()),
  })
)(TokenExpiredTracker)
