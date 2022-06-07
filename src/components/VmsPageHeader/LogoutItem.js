import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { logout } from '_/actions'

import { MsgContext } from '_/intl'
import {
  DropdownItem,
} from '@patternfly/react-core'

// keep stable for integration tests
const USER_LOGOUT_ID = 'usermenu-logout'

const LogoutItem = ({ onLogout }) => {
  const { msg } = useContext(MsgContext)
  return (
    <DropdownItem
      key='logout'
      onClick={onLogout}
      id={USER_LOGOUT_ID}
    >
      {msg.logOut()}
    </DropdownItem>
  )
}

LogoutItem.propTypes = {
  onLogout: PropTypes.func.isRequired,
}

export default connect(
  null,
  (dispatch) => ({
    onLogout: () => dispatch(logout(true)),
  })
)(LogoutItem)
