import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import { Checkbox } from 'ovirt-ui-components'
import {
  logout,
  toggleOptions,
  clearUserMessages,
  changeFilterPermissions,
} from '../../actions/index'

const UserMenu = ({ config, onLogout, onAdministratorFilterClick }) => {
/* TODO: allow 'Options' in the menu
 <li>
 <a href='#' onClick={onOptions}>Options</a>
 </li>
 <li className='divider' />
 */
  if (!config.get('loginToken')) { // this shall really not happen!
    console.error('Missing login token!')
    return (
      <li>
        Please log in
      </li>
    )
  } else {
    let checkbox = null
    if (config.get('administrator')) {
      checkbox = (<li><a><Checkbox checked={config.get('filter')} onClick={onAdministratorFilterClick} label='Filter VM' /></a></li>)
    }
    return (
      <li className='dropdown'>
        <a className={`dropdown-toggle`} data-toggle='dropdown' href='#'>
          <i className='fa fa-sign-out' aria-hidden='true' />&nbsp;
          {config.getIn(['user', 'name'])}
          <b className='caret' />
        </a>
        <ul className='dropdown-menu'>
          {checkbox}
          <li>
            <a href='#' data-toggle='modal' data-target='#about-modal'>About</a>
          </li>

          <li>
            <a href='#' onClick={onLogout}>Log out</a>
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
  onAdministratorFilterClick: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
  }),
  (dispatch) => ({
    onClearMessages: () => dispatch(clearUserMessages()),
    onLogout: () => dispatch(logout()),
    onOptions: () => dispatch(toggleOptions()),
    onAdministratorFilterClick: (filter) => dispatch(changeFilterPermissions(filter)),
  })
)(UserMenu)
