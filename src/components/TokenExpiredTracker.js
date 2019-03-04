import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { MessageDialog, Icon } from 'patternfly-react'

import style from './sharedStyle.css'
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
      counter: props.config.get('userSessionTimeoutInterval'),
    }

    this.dropCounter = this.dropCounter.bind(this)
    this.decrementCounter = this.decrementCounter.bind(this)

    document.body.addEventListener('mousemove', this.dropCounter)
    this.timer = setInterval(this.decrementCounter, 1000)
  }

  static getDerivedStateFromProps (props, state) {
    if (props.config.get('userSessionTimeoutInterval') !== null && state.counter === null) {
      return {
        counter: props.config.get('userSessionTimeoutInterval'),
      }
    }
    return null
  }

  dropCounter () {
    if (!this.state.showTimeoutModal) {
      this.setState({ counter: this.props.config.get('userSessionTimeoutInterval') })
    }
  }
  decrementCounter () {
    if (this.state.counter !== null) {
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
  }

  componentWillUnmount () {
    clearInterval(this.timer)
  }

  render () {
    const { config, onLogout } = this.props
    if (this.state.showTimeoutModal) {
      return <MessageDialog
        show={this.state.counter > 0 && this.state.counter <= TIME_TO_DISPLAY_MODAL}
        primaryAction={() => this.setState({ showTimeoutModal: false, counter: config.get('userSessionTimeoutInterval') })}
        secondaryAction={onLogout}
        onHide={onLogout}
        primaryContent={<p className='lead'>{ msg.sessionExpired() }</p>}
        secondaryContent={
          <React.Fragment>
            <p>{ msg.logOutInSecondsSecondary({ seconds: this.state.counter }) }</p>
            <p>{ msg.continueSessionSecondary() }</p>
          </React.Fragment>
        }
        primaryActionButtonContent={msg.continueSessionBtn()}
        secondaryActionButtonContent={msg.logOut()}
        className={style['header-remover']}
        icon={<Icon type='pf' name='warning-triangle-o' />}
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
