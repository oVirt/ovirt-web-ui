import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import {
  logout,
  toggleOptions,
  clearUserMessages,
  changeFilterPermissions,
} from '../../actions/index'

const FilterCheckbox = ({ config, onClick }) => {
  const onChange = (event) => {
    onClick(event.target.checked)
  }

  // let checked = config.get('filter') ? 'checked' : ''
  return (
    <li>
      <a>
        <label className={`styled-checkbox ${config.get('filter') && 'checked'}`}>
          <input type='checkbox' onChange={onChange} checked={config.get('filter')} />
          <span>Filter VM</span>
        </label>
      </a>
    </li>
  )
}

FilterCheckbox.propTypes = {
  config: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
}

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
      checkbox = <FilterCheckbox config={config} onClick={onAdministratorFilterClick} />
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
