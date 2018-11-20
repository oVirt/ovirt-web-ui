import React from 'react'
import PropTypes from 'prop-types'
import * as branding from './branding'
import { msg } from '_/intl'
import styles from './error.css'
import AppConfiguration from './config'

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
    console.error(error)
    console.error(info.componentStack)
  }

  render () {
    const title = msg.globalErrorBoundaryTitle()
    const descr = msg.globalErrorBoundaryDescription({
      bugUrl: `<a href='https://github.com/oVirt/ovirt-web-ui/issues'>${msg.gitHub()}</a>`,
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
          <div className={`container text-center ${styles['globalErrorContainer']}`}>
            <img src={branding.resourcesUrls.errorImg} />
            <h1 className='bolder'>{title}</h1>
            <p className='h4' dangerouslySetInnerHTML={{ __html: descr }} />
            <div>
              <a href={refreshUrl} className='btn'>{refresh}</a>
              <a href={logoutUrl} className='btn-primary btn'>{logOut}</a>
            </div>
          </div>
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
