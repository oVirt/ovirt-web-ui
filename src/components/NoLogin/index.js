import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { Button } from '@patternfly/react-core'
import { MsgContext } from '_/intl'
import AppConfiguration from '_/config'
import Header from '../Header'
import signOutIcon from './images/sign-out.svg'
import style from './style.css'

/**
 * Login (token) to Engine is missing.
 */
const NoLogin = ({ logoutWasManual = false, isTokenExpired = false }) => {
  const { msg } = useContext(MsgContext)
  return (
    <div>
      <Header />
      <div className={`container text-center ${style['logout-container']}`}>
        <img src={signOutIcon} className={style['logout-icon']} />
        <h1>{msg.loggedOut()}</h1>
        <div className={style['logout-description']}>
          { window.DEVELOPMENT && isTokenExpired && msg.logoutTokenExpiredMessage() }
          { window.DEVELOPMENT && !isTokenExpired && msg.logoutDeveloperMessage() }
          { !window.DEVELOPMENT && msg.logoutRedirected() }
        </div>
        <div>
          <Button
            component='a'
            href={AppConfiguration.applicationURL}
            variant='primary'
          >
            {msg.logBackIn()}
          </Button>
        </div>
      </div>
    </div>
  )
}
NoLogin.propTypes = {
  logoutWasManual: PropTypes.bool.isRequired,
  isTokenExpired: PropTypes.bool,
}

export default NoLogin
