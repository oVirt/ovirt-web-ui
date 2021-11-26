import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { logout } from '_/actions'

import { MsgContext } from '_/intl'
import AboutDialog from '_/components/About'
import { Tooltip } from '_/components/tooltips'
import { UserIcon } from '@patternfly/react-icons/dist/esm/icons'

const UserMenu = ({ config, onLogout }) => {
  const { msg } = useContext(MsgContext)
  const idPrefix = 'usermenu'
  return (
    <li className='dropdown'>
      <Tooltip id={`${idPrefix}-tooltip`} tooltip={config.getIn(['user', 'name'])} placement='bottom'>
        <a className='dropdown-toggle nav-item-iconic' href='#' data-toggle='dropdown' id={`${idPrefix}-user`}>
          <UserIcon /><span className='caret' />
        </a>
      </Tooltip>
      <ul className='dropdown-menu'>
        <li>
          <AboutDialog />
        </li>
        <li>
          <a href='#' onClick={e => { e.preventDefault(); onLogout() }} id={`${idPrefix}-logout`}>{msg.logOut()}</a>
        </li>
      </ul>
    </li>
  )
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
    onLogout: () => dispatch(logout(true)),
  })
)(UserMenu)
