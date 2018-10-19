import React from 'react'

import AddVmButton from './components/VmDialog/AddVmButton'
import PageRouter from './components/PageRouter'
import { VmDetailToolbar, PoolDetailToolbar } from './components/Toolbar'
import { PoolDetailsPage, VmDetailsPage, VmEditPage, VmCreatePage, VmsPage, LegacyVmDetailsPage } from './components/Pages'

import { msg } from './intl'
import { MAIN_PAGE, DETAIL_PAGE, DIALOG_PAGE } from './constants'

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
        type: MAIN_PAGE,
      },

      {
        path: '/vm/add',
        exact: true,
        title: () => msg.addNewVm(),
        component: VmCreatePage,
        toolbars: [], // TODO: Recently not used. When needed, see VmDialog/style.css - .vm-dialog-buttons
        closeable: true,
        type: DIALOG_PAGE,
      },

      {
        path: '/vm/:id',
        title: (match, vms) => vms.getIn(['vms', match.params.id, 'name']) || match.params.id,
        component: VmDetailsPage,
        toolbars: [(match) => (<VmDetailToolbar match={match} key='vmaction' />)],
        routes: [
          {
            path: '/vm/:id/edit',
            title: (match) => msg.edit() || match.params.id,
            component: VmEditPage,
            toolbars: [], // TODO: Recently not used. When needed, see VmDialog/style.css - .vm-dialog-buttons
            closeable: true,
            type: DIALOG_PAGE,
          },
        ],
        type: DETAIL_PAGE,
      },

      {
        path: '/vm-legacy/:id',
        title: (match, vms) => vms.getIn(['vms', match.params.id, 'name']) || match.params.id,
        component: LegacyVmDetailsPage,
        toolbars: [(match) => (<VmDetailToolbar match={match} key='vmaction' />)],
        type: DETAIL_PAGE,
      },

      {
        path: '/pool/:id',
        title: (match, vms) => vms.getIn(['pools', match.params.id, 'name']) || match.params.id,
        component: PoolDetailsPage,
        toolbars: [(match) => (<PoolDetailToolbar match={match} key='poolaction' />)],
        type: DETAIL_PAGE,
      },
    ],
  }]
}
