import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { locationShape } from 'react-router'
import $ from 'jquery'

import './styles.css'

import { clearUserMessages, login } from 'ovirt-ui-components'
import { setRedirectUrl } from './actions'
import AppConfiguration from './config'

import logo from './ovirt_top_right_logo.png'
import brand from './ovirt_top_logo.png'

const Logo = () => {
  return (
    <span id='badge'>
      <img src={logo} alt='oVirt logo' />
    </span>
  )
}

const Brand = () => {
  return (
    <div className='col-sm-12'>
      <div id='brand'>
        <img src={brand} alt='oVirt Basic User Portal' />
      </div>
    </div>
  )
}

const WelcomeText = () => {
  return (
    <div className='col-sm-5 col-md-6 col-lg-7 details'>
      <p>
        <strong>Welcome to oVirt Basic User Portal</strong>
      </p>
    </div>
  )
}

const LoginFailed = () => {
  return (
    <div className='form-group'>
      <div className='col-sm-10 col-md-10'>
        <div className={'login-failed-text'}>
          Login failed
        </div>
      </div>
    </div>
  )
}
LoginFailed.propTypes = {}

/**
 * Deprecated, since oVirt SSO
 */
class LoginForm extends Component {
  constructor (props) {
    super(props)

    this.state = { username: '', password: '' }

    this.onUserChanged = this.onUserChanged.bind(this)
    this.onPwdChanged = this.onPwdChanged.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)

    this.onLogin = props.onLogin
  }

  onUserChanged (e) {
    this.setState({ username: e.target.value })
  }
  onPwdChanged (e) {
    this.setState({ password: e.target.value })
  }
  handleSubmit (e) {
    e.preventDefault()
    const { username, password } = this.state
    const { location } = this.props
    const redirectUrl = (location.state && location.state.nextPathname) ? location.state.nextPathname : `${AppConfiguration.applicationURL}/`
    console.log(`Redirect url: ${redirectUrl}`)
    this.onLogin({ username, password, redirectUrl })
  }

  componentWillMount () {
    $('html').addClass('login-pf')
  }

  componentWillUnmount () {
    $('html').removeClass('login-pf')
  }

  // TODO: user-defined REST API URL
  // TODO: dropdown for Profile

  isLoginFailed (userMessages) {
    return userMessages.get('records').find((msg) => (msg.type === 'access_denied' || msg.type === 'no_access')) !== undefined
  }

  render () {
    const { userMessages } = this.props

    const loginFailed = this.isLoginFailed(userMessages) ? (<LoginFailed />) : ''

    return (<div>
      <Logo />

      <div className='container'>
        <div className='row'>
          <Brand />

          <div className='col-sm-7 col-md-6 col-lg-5 login'>
            <form className='form-horizontal' role='form' onSubmit={this.handleSubmit}>
              <div className='form-group'>
                <label htmlFor='inputUsername' className='col-sm-2 col-md-2 control-label'>Username</label>
                <div className='col-sm-10 col-md-10'>
                  <input type='text' className='form-control' id='inputUsername' placeholder='' tabIndex='1' value={this.state.username} onChange={this.onUserChanged} />
                </div>
              </div>

              <div className='form-group'>
                <label htmlFor='inputPassword' className='col-sm-2 col-md-2 control-label'>Password</label>
                <div className='col-sm-10 col-md-10'>
                  <input type='password' className='form-control' id='inputPassword' placeholder='' tabIndex='2' value={this.state.password} onChange={this.onPwdChanged} />
                </div>
              </div>

              <div className='form-group'>
                <div className='col-xs-8 col-sm-offset-2 col-sm-6 col-md-offset-2 col-md-6' />

                <div className='col-xs-4 col-sm-4 col-md-4 submit'>
                  <button type='submit' className='btn btn-primary btn-lg' tabIndex='4'>Log In</button>
                </div>
              </div>

              {loginFailed}
            </form>
          </div>

          <WelcomeText />
        </div>
      </div>
    </div>)
  }
}
LoginForm.propTypes = {
  onLogin: PropTypes.func.isRequired,
  userMessages: PropTypes.object.isRequired, // TODO: Immutable.js in props?
  location: locationShape,
}

export default connect(
  (state) => ({
    userMessages: state.userMessages,
  }),
  (dispatch, ownProps) => ({
    onLogin: ({ username, password, redirectUrl }) => {
      dispatch(clearUserMessages())
      dispatch(setRedirectUrl(redirectUrl))
      dispatch(login({ username, password }))
    },
  })
)(LoginForm)
