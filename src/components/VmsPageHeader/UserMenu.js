import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import {
  logout,
  toggleOptions,
  clearUserMessages,
} from '../../actions/index'

import { msg } from '../../intl'

const UserMenu = ({ config, onLogout }) => {
  if (!config.get('loginToken')) { // this shall really not happen!
    console.error('Missing login token!')
    return (
      <li>
        {msg.pleaseLogIn()}
      </li>
    )
  } else {
    return (
      <li className='dropdown'>
        <a className='dropdown-toggle nav-item-iconic' href='#' data-toggle='dropdown' title={config.getIn(['user', 'name'])}>
          <i className='pficon pficon-user' /><span className='caret' />
        </a>
        <ul className='dropdown-menu'>
          <li>
            <a href='#' data-toggle='modal' data-target='#options-modal'>{msg.options()}</a>
          </li>
          <li>
            <a href='#' data-toggle='modal' data-target='#about-modal'>{msg.about()}</a>
          </li>
          <li>
            <a href='#' onClick={onLogout}>{msg.logOut()}</a>
          </li>
        </ul>
      </li>
    )
  }
}

UserMenu.propTypes = {
  config: PropTypes.object.isRequired,
  onLogout: PropTypes.func.isRequired,
  onOptions: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
  }),
  (dispatch) => ({
    onClearMessages: () => dispatch(clearUserMessages()),
    onLogout: () => dispatch(logout()),
    onOptions: () => dispatch(toggleOptions()),
  })
)(UserMenu)
