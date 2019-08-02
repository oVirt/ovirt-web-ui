import React from 'react'

import { DETAIL_PAGE_TYPE, MAIN_PAGE_TYPE, CONSOLE_PAGE_TYPE, NO_REFRESH_TYPE } from '_/constants'
import { msg } from '_/intl'

import PageRouter from './components/PageRouter'
import Handler404 from './Handler404'
import { VmDetailToolbar, VmConsoleToolbar, VmsListToolbar } from './components/Toolbar'
import { VmDetailsPage, VmsPage, VmConsolePage } from './components/Pages'

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
        component: VmsPage,
        toolbars: (match) => (<VmsListToolbar match={match} vms={vms} key='addbutton' />),
        type: MAIN_PAGE_TYPE,
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
        title: '404',
        component: Handler404,
        toolbars: null,
        type: NO_REFRESH_TYPE,
        breadcrumb: false,
      },
    ],
  }]
}
