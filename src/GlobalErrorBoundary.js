import React from 'react'
import PropTypes from 'prop-types'
import { msg } from '_/intl'
import AppConfiguration from './config'
import ErrorContent from '_/components/ErrorContent'
import * as branding from '_/branding'

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
    const trackText = branding.fixedStrings.ISSUES_TRACKER_TEXT || 'Github Issue Tracker'
    const trackUrl = branding.fixedStrings.ISSUES_TRACKER_URL || 'https://github.com/oVirt/ovirt-web-ui/issues'
    // const title = msg.globalErrorBoundaryTitle()
    const descr = msg.globalErrorBoundaryDescription({
      bugUrl: `<a href='${trackUrl}'>${trackText}</a>`,
    })
    const logOut = msg.logOut()
    const refresh = msg.refresh()
    const refreshUrl = AppConfiguration.applicationURL
    const logoutUrl = AppConfiguration.applicationURL + '/sso/logout'
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
            description={msg.globalErrorBoundaryDescription(descr)}
            leftButton={{
              href: logoutUrl,
              title: logOut,
            }}
            rightButton={{
              href: refreshUrl + '/sso/logout',
              title: refresh,
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
