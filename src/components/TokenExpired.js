import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { SessionTimeout } from 'patternfly-react'

import ErrorAlert from './ErrorAlert'
import { msg } from '_/intl'

import { logout } from '_/actions'

const MAX_INACTIVE_TIME = 60 * 20 // 20 minutes
const TIME_TO_DISPLAY_MODAL = 30 // 30 seconds

// TODO: allow the user to cancel the automatic reload?
// If so, change config.isTokenExpired to false and add additional check to doCheckTokenExpired() before actual reload
class TokenExpired extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      expired: false,
      counter: MAX_INACTIVE_TIME,
    }

    this.dropCounter = this.dropCounter.bind(this)
    this.decrementCounter = this.decrementCounter.bind(this)

    document.body.addEventListener('mousemove', this.dropCounter)
    this.timer = setInterval(this.decrementCounter, 1000)
  }

  dropCounter () {
    if (!this.state.expired) {
      this.setState({ counter: MAX_INACTIVE_TIME })
    }
  }
  decrementCounter () {
    const state = {
      counter: this.state.counter - 1,
    }
    if (this.state.counter <= TIME_TO_DISPLAY_MODAL && !this.state.expired) {
      state.expired = true
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
    if (this.state.expired) {
      return <SessionTimeout
        timeLeft={this.state.counter}
        displayBefore={TIME_TO_DISPLAY_MODAL}
        continueFnc={() => this.setState({ expired: false, counter: MAX_INACTIVE_TIME })}
        logoutFnc={onLogout}
        primaryContent={<p className='lead'>{ msg.sessionExpired() }</p>}
        secondaryContent={
          <React.Fragment>
            <p>{ msg.logOutIn30SecondsSecondary() }</p>
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
TokenExpired.propTypes = {
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
)(TokenExpired)
