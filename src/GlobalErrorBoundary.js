import React from 'react'
import PropTypes from 'prop-types'
import * as branding from './branding'
import { msg } from '_/intl'
import AppConfiguration from './config'
import ErrorContent from '_/components/ErrorContent'

class GlobalErrorBoundary extends React.Component {
  constructor (props) {
    super(props)
    this.state = { hasError: false }
    this.props.errorBridge.setErrorHandler((error) => {
      this.setState({ hasError: true })
      console.error(error)
    })
  }

  componentDidCatch (error, info) {
    this.setState({ hasError: true })
    if (!window.DEVELOPMENT) {
      console.error(error)
      console.error(info.componentStack)
    }
  }

  render () {
    if (this.state.hasError) {
      return (
        <div>
          <nav className='navbar obrand_mastheadBackground obrand_topBorder navbar-pf-vertical'>
            <div className='navbar-header'>
              <a href='/' className='navbar-brand obrand_headerLogoLink' id='pageheader-logo'>
                <img className='obrand_mastheadLogo' src={branding.resourcesUrls.clearGif} />
              </a>
            </div>
          </nav>
          <ErrorContent
            title={msg.globalErrorBoundaryTitle()}
            description={msg.globalErrorBoundaryDescription({
              bugUrl: `<a href='https://github.com/oVirt/ovirt-web-ui/issues'>${msg.gitHub()}</a>`,
            })}
            leftButton={{
              href: AppConfiguration.applicationURL,
              title: msg.refresh(),
            }}
            rightButton={{
              href: AppConfiguration.applicationURL + '/sso/logout',
              title: msg.logOut(),
            }}
          />
        </div>
      )
    }
    return this.props.children
  }
}

GlobalErrorBoundary.propTypes = {
  children: PropTypes.object.isRequired,
  errorBridge: PropTypes.object.isRequired,
}

export default GlobalErrorBoundary
