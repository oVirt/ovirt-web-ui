import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withMsg } from '_/intl'
import { UserIcon } from '@patternfly/react-icons/dist/esm/icons'
import {
  Dropdown,
  DropdownItem,
  DropdownToggle,
  ToolbarItem,
} from '@patternfly/react-core'

import LogoutItem from './LogoutItem'

// keep stable for integration tests
export const USER_TOGGLE_ID = 'usermenu-user'
export const USER_KEBBAB_TOGGLE_ID = 'kebab-usermenu-user'

const UserMenu = ({ username, openAboutDialog, msg }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const onDropdownSelect = () => {}
  return (
    <ToolbarItem >
      <Dropdown
        position="right"
        onSelect={onDropdownSelect}
        isOpen={isDropdownOpen}
        toggle={ (
          <DropdownToggle
            id={USER_TOGGLE_ID}
            icon={<UserIcon/>}
            onToggle={setDropdownOpen}
          >
            {username}
          </DropdownToggle>
        ) }
        dropdownItems={[
          <DropdownItem key="about" id='about-modal-link' onClick={openAboutDialog}>
            {msg.about()}
          </DropdownItem>,
          <LogoutItem key="logout"/>]}
      />
    </ToolbarItem>
  )
}

UserMenu.propTypes = {
  username: PropTypes.string.isRequired,
  msg: PropTypes.object.isRequired,
  openAboutDialog: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    username: state.config.getIn(['user', 'name'], ''),
  }),
  null
)(withMsg(UserMenu))
