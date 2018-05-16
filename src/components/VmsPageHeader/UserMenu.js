import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import { logout } from '../../actions/index'

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
    const idPrefix = 'usermenu'
    return (
      <li className='dropdown'>
        <a className='dropdown-toggle nav-item-iconic' href='#' data-toggle='dropdown' title={config.getIn(['user', 'name'])} id={`${idPrefix}-user`}>
          <i className='pficon pficon-user' /><span className='caret' />
        </a>
        <ul className='dropdown-menu'>
          <li>
            <a href='#' data-toggle='modal' data-target='#options-modal' id={`${idPrefix}-options`}>{msg.options()}</a>
          </li>
          <li>
            <a href='#' data-toggle='modal' data-target='#about-modal' id={`${idPrefix}-about`}>{msg.about()}</a>
          </li>
          <li>
            <a href='#' onClick={onLogout} id={`${idPrefix}-logout`}>{msg.logOut()}</a>
          </li>
        </ul>
      </li>
    )
  }
}

UserMenu.propTypes = {
  config: PropTypes.object.isRequired,
  onLogout: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
  }),
  (dispatch) => ({
    onLogout: () => dispatch(logout()),
  })
)(UserMenu)
