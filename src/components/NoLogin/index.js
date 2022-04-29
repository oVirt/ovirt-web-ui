import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import {
  Button,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Page,
  Title,
} from '@patternfly/react-core'
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
    <Page header={<Header/>} >
      <EmptyState>
        <EmptyStateIcon icon={() => <img src={signOutIcon} className={style['logout-icon']} />} />
        <Title headingLevel="h4" size="lg">
          {msg.loggedOut()}
        </Title>
        <EmptyStateBody>
          { window.DEVELOPMENT && isTokenExpired && msg.logoutTokenExpiredMessage() }
          { window.DEVELOPMENT && !isTokenExpired && msg.logoutDeveloperMessage() }
          { !window.DEVELOPMENT && msg.logoutRedirected() }
        </EmptyStateBody>

        <Button
          component='a'
          href={AppConfiguration.applicationURL}
          variant='primary'
        >
          {msg.logBackIn()}
        </Button>
      </EmptyState>

    </Page>
  )
}

NoLogin.propTypes = {
  logoutWasManual: PropTypes.bool.isRequired,
  isTokenExpired: PropTypes.bool,
}

export default NoLogin
