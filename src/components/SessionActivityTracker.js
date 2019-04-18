import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { MessageDialog, Icon } from 'patternfly-react'

import style from './sharedStyle.css'
import { msg } from '_/intl'

import { logout } from '_/actions'

const TIME_TO_DISPLAY_MODAL = 30 // 30 seconds

class SessionActivityTracker extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showTimeoutModal: false,
      counter: props.config.get('userSessionTimeoutInterval'),
    }

    this.dropCounter = this.dropCounter.bind(this)
    this.decrementCounter = this.decrementCounter.bind(this)
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
    this.setState(state => {
      const { counter } = state
      if (counter !== null) {
        return {
          counter: counter - 1,
          showTimeoutModal: counter <= TIME_TO_DISPLAY_MODAL,
        }
      }
      return null
    }, () => {
      if (this.state.counter <= 0) {
        this.props.onLogout()
      }
    })
  }

  componentDidMount () {
    document.body.addEventListener('mousemove', this.dropCounter)
    this.timer = setInterval(this.decrementCounter, 1000)
  }

  componentWillUnmount () {
    document.body.removeEventListener('mousemove', this.dropCounter)
    if (this.timer) {
      clearInterval(this.timer)
    }
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

    return null
  }
}
SessionActivityTracker.propTypes = {
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
)(SessionActivityTracker)
