import React from 'react'

import AddVmButton from './components/VmDialog/AddVmButton'
import PageRouter from './components/PageRouter'
import { VmDetailToolbar, PoolDetailToolbar, VmConsoleToolbar } from './components/Toolbar'
import { PoolDetailsPage, VmDetailsPage, VmCreatePage, VmsPage, VmConsolePage } from './components/Pages'

import { msg } from '_/intl'
import { DETAIL_PAGE_TYPE, DIALOG_PAGE_TYPE, MAIN_PAGE_TYPE, POOL_PAGE_TYPE, CONSOLE_PAGE_TYPE } from '_/constants'

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
        toolbars: [() => (<AddVmButton key='addbutton' id={`route-add-vm`} />)],
        type: MAIN_PAGE_TYPE,
      },

      {
        path: '/vm/add',
        exact: true,
        title: () => msg.addNewVm(),
        component: VmCreatePage,
        toolbars: [], // TODO: When needed, see VmDialog/style.css - .vm-dialog-buttons
        closeable: true,
        type: DIALOG_PAGE_TYPE,
      },

      {
        path: '/vm/:id',
        title: (match, vms) => vms.getIn(['vms', match.params.id, 'name']) || match.params.id,
        component: VmDetailsPage,
        toolbars: [(match) => (<VmDetailToolbar match={match} key='vmaction' />)],
        type: DETAIL_PAGE_TYPE,
        routes: [
          {
            path: '/vm/:id/console/:console',
            title: (match) => msg.console(),
            component: VmConsolePage,
            closeable: true,
            toolbars: [(match) => (<VmConsoleToolbar match={match} key='vmconsole' />)],
            isToolbarFullWidth: true,
            type: CONSOLE_PAGE_TYPE,
          },
        ],
      },

      {
        path: '/pool/:id',
        title: (match, vms) => vms.getIn(['pools', match.params.id, 'name']) || match.params.id,
        component: PoolDetailsPage,
        toolbars: [(match) => (<PoolDetailToolbar match={match} key='poolaction' />)],
        type: POOL_PAGE_TYPE,
      },
    ],
  }]
}
