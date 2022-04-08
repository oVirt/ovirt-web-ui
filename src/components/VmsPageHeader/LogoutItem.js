import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { logout } from '_/actions'

import { MsgContext } from '_/intl'
import {
  DropdownItem,
} from '@patternfly/react-core'

const LogoutItem = ({ onLogout }) => {
  const { msg } = useContext(MsgContext)
  const idPrefix = 'usermenu'
  return (
    <DropdownItem key='logout' onClick={onLogout} id={`${idPrefix}-logout`}>
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
