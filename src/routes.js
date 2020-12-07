import React from 'react'

import PageRouter from './components/PageRouter'

import Handler404 from './Handler404'
import {
  VmDetailToolbar,
  VmConsoleToolbar,
  VmsListToolbar,
  SettingsToolbar,
} from './components/Toolbar'
import {
  VmDetailsPage,
  VmsListPage,
  GlobalSettingsPage,
  VmConsolePage,
} from './components/Pages'

import { msg } from '_/intl'
import {
  DETAIL_PAGE_TYPE,
  LIST_PAGE_TYPE,
  CONSOLE_PAGE_TYPE,
  NO_REFRESH_TYPE,
  SETTINGS_PAGE_TYPE,
} from '_/constants'

/**
 * Function get vms object, and return routes object
 *
 * Every route must have:
 *   - path,
 *   - component that presents page,
 *   - title (except top route), it can be function (get match parameter) or string,
 *   - toolbars (as array of functions that get match parameter and return a component)
 *
 * @param vms {object}
 * @return {array}
 */
export default function getRoutes (vms) {
  return [{
    component: PageRouter,
    routes: [
      {
        path: '/',
        exact: true,
        component: VmsListPage,
        toolbars: (match) => (<VmsListToolbar match={match} vms={vms} key='addbutton' />),
        type: LIST_PAGE_TYPE,
        isToolbarFullWidth: true,
      },

      {
        path: '/vm/:id',
        title: (match, vms) => vms.getIn(['vms', match.params.id, 'name']) || match.params.id,
        component: VmDetailsPage,
        toolbars: (match) => (<VmDetailToolbar match={match} key='vmaction' />),
        type: DETAIL_PAGE_TYPE,
        routes: [
          {
            path: '/vm/:id/console/:console',
            title: (match) => msg.console(),
            component: VmConsolePage,
            closeable: true,
            toolbars: (match) => (<VmConsoleToolbar match={match} key='vmconsole' />),
            isToolbarFullWidth: true,
            type: CONSOLE_PAGE_TYPE,
          },
        ],
      },

      {
        path: '/settings',
        exact: true,
        title: msg.accountSettings(),
        component: GlobalSettingsPage,
        toolbars: SettingsToolbar,
        isToolbarFullWidth: true,
        type: SETTINGS_PAGE_TYPE,
      },

      {
        title: '404',
        component: Handler404,
        toolbars: null,
        type: NO_REFRESH_TYPE,
        breadcrumb: false,
      },
    ],
  }]
}
