import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { push } from 'connected-react-router'
import { connect } from 'react-redux'

import UserMenu, { USER_KEBBAB_TOGGLE_ID } from './UserMenu'

import { manualRefresh } from '_/actions'
import { MsgContext } from '_/intl'
import { Tooltip } from '../tooltips'
import {
  CogIcon,
  SyncAltIcon,
  BellIcon,
} from '@patternfly/react-icons/dist/esm/icons'
import {
  Button,
  ButtonVariant,
  Divider,
  Dropdown,
  DropdownItem,
  KebabToggle,
  NotificationBadge,
  Toolbar,
  ToolbarItem,
  ToolbarGroup,
  ToolbarContent,
} from '@patternfly/react-core'

import LogoutItem from './LogoutItem'
import AboutDialog from '../About'
/**
 * Main application header on top of the page
 */
const VmsPageHeader = ({ appReady, onRefresh, onCloseNotificationDrawer, isDrawerExpanded, unreadNotificationCount, goToSettings }) => {
  const { msg } = useContext(MsgContext)
  const idPrefix = 'pageheader'
  const [isKebabDropdownOpen, setKebabDropdownOpen] = useState(false)
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false)

  return (
    <Toolbar isFullHeight isStatic>
      <ToolbarContent>
        <ToolbarGroup
          variant="icon-button-group"
          alignment={{ default: 'alignRight' }}
        >
          <ToolbarItem>
            <NotificationBadge
              count={unreadNotificationCount}
              variant={ unreadNotificationCount === 0 ? 'read' : 'unread'}
              onClick={onCloseNotificationDrawer}
              aria-label={msg.notifications()}
            >
              <BellIcon />
            </NotificationBadge>
          </ToolbarItem>
          <ToolbarGroup
            variant="icon-button-group"
            visibility={{ default: 'hidden', md: 'visible' }}
          >
            {appReady && (
              <ToolbarItem>
                <Tooltip id={`${idPrefix}-tooltip`} tooltip={msg.refresh()} placement='bottom'>
                  <Button aria-label={msg.refresh()} variant={ButtonVariant.plain} onClick={onRefresh} id={`${idPrefix}-refresh`}>
                    <SyncAltIcon />
                  </Button>
                </Tooltip>
              </ToolbarItem>
            )}

            {appReady && (
              <ToolbarItem>
                <Tooltip id={`${idPrefix}-tooltip`} tooltip={msg.accountSettings()} placement='bottom'>
                  <Button aria-label={msg.accountSettings()} variant={ButtonVariant.plain} onClick={goToSettings} id={`${idPrefix}-settings`}>
                    <CogIcon />
                  </Button>
                </Tooltip>
              </ToolbarItem>
            )}

            <UserMenu openAboutDialog={() => setIsAboutDialogOpen(true)}/>

          </ToolbarGroup>
          <ToolbarItem visibility={{ default: 'visible', md: 'hidden', lg: 'hidden', xl: 'hidden', '2xl': 'hidden' }}>
            <Dropdown
              isPlain
              position="right"
              onSelect={() => setKebabDropdownOpen(!isKebabDropdownOpen)}
              toggle={(
                <KebabToggle
                  id={USER_KEBBAB_TOGGLE_ID}
                  onToggle={() => setKebabDropdownOpen(!isKebabDropdownOpen)}
                />
              )}
              isOpen={isKebabDropdownOpen}
              dropdownItems={[
                appReady && (
                  <DropdownItem key="refresh" onClick={onRefresh}>
                    <SyncAltIcon /> {msg.refresh()}
                  </DropdownItem>
                ),
                appReady && (
                  <DropdownItem key="settings" onClick={goToSettings}>
                    <CogIcon /> {msg.accountSettings()}
                  </DropdownItem>
                ),
                appReady && <Divider key="divider" />,
                <DropdownItem key="about" id='about-modal-link' onClick={() => setIsAboutDialogOpen(true)}>
                  {msg.about()}
                </DropdownItem>,
                <LogoutItem key="logout"/>,
              ].filter(Boolean)}
            />
          </ToolbarItem>

        </ToolbarGroup>

      </ToolbarContent>
      <AboutDialog closeDialog={() => setIsAboutDialogOpen(false)} isOpen={isAboutDialogOpen}/>
    </Toolbar>
  )
}
VmsPageHeader.propTypes = {
  appReady: PropTypes.bool.isRequired,
  isDrawerExpanded: PropTypes.bool.isRequired,
  unreadNotificationCount: PropTypes.number.isRequired,

  goToSettings: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onCloseNotificationDrawer: PropTypes.func.isRequired,
}

export default connect(
  ({ config, userMessages }) => ({
    appReady: !!config.get('appConfigured'), // When is the app ready to display data components?
    // all known messages are marked as unread
    unreadNotificationCount: userMessages.get('records')?.size ?? 0,
  }),
  (dispatch) => ({
    onRefresh: () => dispatch(manualRefresh()),
    goToSettings: () => dispatch(push('/settings')),
  })
)(VmsPageHeader)
