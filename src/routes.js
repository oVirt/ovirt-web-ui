import React, { useState, useContext } from 'react'

import {
  HomeIcon,
} from '@patternfly/react-icons'

import Handler404 from './Handler404'

import PropTypes from 'prop-types'

import {
  VmDetailsPage,
  VmsListPage,
  GlobalSettingsPage,
  VmConsolePage,
} from './components/Pages'

import Header from './components/Header'
import Breadcrumb from './components/Breadcrumb'

import VmsPageHeader from '_/components/VmsPageHeader'

import OvirtApiCheckFailed from '_/components/OvirtApiCheckFailed'

import ToastNotifications from '_/components/ToastNotifications'
import VmUserMessages from '_/components/VmUserMessages'

import RefreshIntervalChangeHandler from '_/components/RefreshIntervalChangeHandler'

import ConsoleNotificationsDialog from '_/components/VmActions/ConsoleNotificationsDialog'

import { fixedStrings } from '_/branding'

import { Outlet } from 'react-router-dom'

import { MsgContext } from '_/intl'

import SessionActivityTracker from '_/components/SessionActivityTracker'

import {
  Page,
} from '@patternfly/react-core'

const AppLayout = ({ appReady, activateSessionTracker }) => {
  const [isDrawerExpanded, setDrawerExpanded] = useState(false)
  const { msg } = useContext(MsgContext)

  const toggleNotificationDrawer = () => setDrawerExpanded((current) => !current)

  return (
    <>
      <ToastNotifications />
      <ConsoleNotificationsDialog/>
      { appReady && activateSessionTracker && <SessionActivityTracker /> }
      {appReady && <RefreshIntervalChangeHandler />}
      <Page
        header={(
          <Header>
            <VmsPageHeader
              title={fixedStrings.BRAND_NAME + ' ' + msg.vmPortal()}
              onCloseNotificationDrawer={toggleNotificationDrawer}
            />
          </Header>
        )}
        notificationDrawer={<VmUserMessages onClose={toggleNotificationDrawer} />}
        isNotificationDrawerExpanded={isDrawerExpanded}
      >
        <div id='page-router'>
          <Breadcrumb />
          <div id='page-router-render-component'>
            <Outlet />
          </div>
        </div>
        <OvirtApiCheckFailed />
      </Page>
    </>
  )
}

AppLayout.propTypes = {
  appReady: PropTypes.bool.isRequired,
  activateSessionTracker: PropTypes.bool.isRequired,
}

/**
 * Function get vms object, and return routes object
 *
 * Every route must have:
 *   - path,
 *   - element that presents page,
 *   - title (except top route), it can be function (get match parameter) or string,
 *   - toolbars (as array of functions that get match parameter and return a component)
 *
 * @return {array}
 */
export default function getRoutes ({ appReady, activateSessionTracker }) {
  return [{
    path: '/',
    handle: {
      breadcrumb: ({ msg }) => ({
        label: msg.virtualMachines(),
        to: '/',
        icon: HomeIcon,
      }),
    },
    element: <AppLayout appReady={appReady} activateSessionTracker={activateSessionTracker} />,
    errorElement: <Handler404 />,
    children: [
      {
        index: true,
        element: appReady ? <VmsListPage /> : null,
      },
      {
        path: 'settings',
        element: <GlobalSettingsPage />,
        handle: {
          breadcrumb: ({ msg }) => ({
            label: msg.accountSettings(),
          }),
        },
      },
      {
        path: 'vm/:id',
        element: <VmDetailsPage />,
        handle: {
          breadcrumb: ({ params, vms }) => ({
            label: vms.getIn(['vms', params.id, 'name']) || params.id,
          }),
        },
      },
      {
        path: 'vm/:id/console/:consoleType',
        element: <VmConsolePage />,
        handle: {
          extraBreadcrumbs: ({ params, vms }) => ([{
            label: vms.getIn(['vms', params.id, 'name']) || params.id,
            to: `/vm/${params.id}`,
          }]),
          breadcrumb: ({ msg }) => ({
            label: msg.console(),
          }),
        },
      },
    ],
  }]
}
