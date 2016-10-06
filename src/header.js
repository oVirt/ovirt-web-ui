import React, { Component } from 'react'
import AuditLog from './auditlog'

import './header.css'

import {logout} from 'ovirt-ui-components'

class LoginButton extends Component {
    render () {
        const {config, dispatch} = this.props

        const onLogout = () => dispatch(logout())
        const onLogin = () => {} // dispatch(showLoginDialog())

        if (config.get('loginToken')) {
            return (<a className="user-name" href="#" onClick={onLogout}>
                <i className="fa fa-sign-out" aria-hidden="true"></i>&nbsp;{config.getIn(['user', 'name'])}
            </a>)
        }
        return (<a className="user-name" href="#" onClick={onLogin}><i className="fa fa-sign-out" aria-hidden="true"></i>&nbsp;Login</a>) // TODO: dispatch login action to show login dialog
    }
}
LoginButton.propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    config: React.PropTypes.object.isRequired
}

/**
 * Main header application on top of the page
 */
class Header extends Component {
    isUnread (auditLog) {
        return auditLog.get('unread')
    }
    render () {
        const {auditLog, config, dispatch} = this.props

        return (<nav className="navbar navbar-default navbar-pf">
            <div className="container-fluid">
                <div className="navbar-header">
                    <a className="navbar-brand" href="/">oVirt User Portal</a>
                </div>
                <ul className="nav navbar-nav navbar-utility">
                    <li>
                        <LoginButton dispatch={dispatch} config={config}/>
                    </li>

                    <li className="dropdown">
                        <a href="#" data-toggle="dropdown">
                            <div className={this.isUnread(auditLog) ? 'auditlog-unread' : 'auditlog-allread'}>
                                <span className="pficon pficon-info"></span>&nbsp;Messages
                            </div>
                        </a>
                        <AuditLog auditLog={auditLog} config={config} dispatch={dispatch}/>
                    </li>
                </ul>
                </div>
            </nav>
        )
    }
}
Header.propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    auditLog: React.PropTypes.object.isRequired,
    config: React.PropTypes.object.isRequired
}

export default Header
