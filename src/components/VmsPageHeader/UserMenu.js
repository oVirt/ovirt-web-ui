import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import { logout, showLoginDialog, toggleOptions, clearUserMessages } from '../../actions'

const UserMenu = ({ config, onLogout, onLogin }) => {
/* TODO: allow 'Options' in the menu
 <li>
 <a href='#' onClick={onOptions}>Options</a>
 </li>
 <li className='divider' />
 */
  if (config.get('loginToken')) {
    return (
      <li className='dropdown'>
        <a className={`dropdown-toggle`} data-toggle='dropdown' href='#'>
          <i className='fa fa-sign-out' aria-hidden='true' />&nbsp;
          {config.getIn(['user', 'name'])}
          <b className='caret' />
        </a>
        <ul className='dropdown-menu'>
          <li>
            <a href='#' onClick={onLogout}>Log out</a>
          </li>
        </ul>
      </li>
    )
  }

  // TODO: dispatch login action to show login dialog
  return (
    <li>
      <a className='user-name' href='#' onClick={onLogin}>
        <i className='fa fa-sign-in' aria-hidden='true' />&nbsp;Login
      </a>
    </li>
  )
}
UserMenu.propTypes = {
  config: PropTypes.object.isRequired,
  onLogout: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
  onOptions: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
  }),
  (dispatch) => ({
    onClearMessages: () => dispatch(clearUserMessages()),
    onLogout: () => dispatch(logout()),
    onLogin: () => dispatch(showLoginDialog()),
    onOptions: () => dispatch(toggleOptions()),
  })
)(UserMenu)
