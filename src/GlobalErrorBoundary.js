import React from 'react'
import PropTypes from 'prop-types'
import { msg, MsgContext, createMessages, locale } from './intl'
import { logout } from '_/actions'
import AppConfiguration from '_/config'
import ErrorContent from '_/components/ErrorContent'
import * as branding from '_/branding'

class GlobalErrorBoundary extends React.Component {
  constructor (props) {
    super(props)

    this.reloadMsg = (locale) => {
      this.setState(({ msgContextState }) => ({ msgContextState: {
        msg: createMessages(locale),
        locale,
        reloadMsg: msgContextState.reloadMsg,
      },
      }))
    }

    this.state = {
      hasError: false,
      msgContextState: {
        msg,
        reloadMsg: this.reloadMsg,
        locale,
      },
    }

    this.props.errorBridge.setErrorHandler((error) => {
      this.setState({ hasError: true })
      console.error(error)
    })

    this.doLogout = this.doLogout.bind(this)
  }

  componentDidCatch (error, info) {
    this.setState({ hasError: true })
    if (!window.DEVELOPMENT) {
      console.error(error)
      console.error(info.componentStack)
    }
  }

  doLogout () {
    if (this.props.store) {
      this.props.store.dispatch(logout())
      this.setState({ hasError: false })
    } else {
      if (AppConfiguration.applicationLogoutURL && AppConfiguration.applicationLogoutURL.length > 0) {
        window.location.href = AppConfiguration.applicationLogoutURL
      }
    }
  }

  render () {
    const { hasError, msgContextState: { msg } } = this.state
    const trackText = branding.fixedStrings.ISSUES_TRACKER_TEXT || 'Github Issue Tracker'
    const trackUrl = branding.fixedStrings.ISSUES_TRACKER_URL || 'https://github.com/oVirt/ovirt-web-ui/issues'
    const descr = msg.globalErrorBoundaryDescription({
      bugUrl: `<a href='${trackUrl}'>${trackText}</a>`,
    })

    if (hasError) {
      return (
        <div>
          <nav className='navbar navbar-pf-vertical obrand_masthead'>
            <div className='navbar-header'>
              <a href='/' className='navbar-brand obrand_headerLogoLink' id='pageheader-logo'>
                <img className='obrand_mastheadLogo' src={branding.resourcesUrls.clearGif} />
              </a>
            </div>
          </nav>
          <ErrorContent
            title={msg.globalErrorBoundaryTitle()}
            description={descr}
            leftButton={{
              href: '#',
              onClick: this.doLogout,
              title: msg.logOut(),
            }}
            rightButton={{
              href: AppConfiguration.applicationURL,
              title: msg.refresh(),
            }}
          />
        </div>
      )
    }
    return (<MsgContext.Provider value={this.state.msgContextState}>{this.props.children}</MsgContext.Provider>)
  }
}

GlobalErrorBoundary.propTypes = {
  children: PropTypes.object.isRequired,
  errorBridge: PropTypes.object.isRequired,
  store: PropTypes.object,
}

export default GlobalErrorBoundary
