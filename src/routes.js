import React from 'react'

import AddVmButton from './components/VmDialog/AddVmButton'
import PageRouter from './components/PageRouter'
import { VmDetailToolbar, PoolDetailToolbar } from './components/Toolbar'
import { PoolDetailPage, VmDetailPage, VmDialogPage, VmsPage } from './components/Pages'
import { msg } from './intl'

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
const getRoutes = (vms) => ([
  {
    component: PageRouter,
    routes: [
      {
        path: '/',
        exact: true,
        component: VmsPage,
        toolbars: [(match) => (<AddVmButton key='addbutton' id={`route-add-vm`} />)],
      },

      {
        path: '/vm/add',
        exact: true,
        title: (match) => msg.addNewVm(),
        component: VmDialogPage,
        toolbars: [], // Recently not used. When needed, see VmDialog/style.css - .vm-dialog-buttons
      },
      {
        path: '/vm/:id',
        title: (match) => { return vms.getIn(['vms', match.params.id, 'name']) },
        component: VmDetailPage,
        toolbars: [(match) => (<VmDetailToolbar match={match} key='vmaction' />)],
        routes: [
          {
            path: '/vm/:id/edit',
            title: (match) => msg.edit(),
            component: VmDialogPage,
            toolbars: [], // Recently not used. When needed, see VmDialog/style.css - .vm-dialog-buttons
          },
        ],
      },

      {
        path: '/pool/:id',
        title: (match) => { return vms.getIn(['pools', match.params.id, 'name']) },
        component: PoolDetailPage,
        toolbars: [(match) => (<PoolDetailToolbar match={match} key='poolaction' />)],
      },
    ],
  },
])

/**
 * Return array of objects that describe vertical menu
 * @return {array}
 */
const getMenu = () => ([
  {
    icon: 'pficon pficon-virtual-machine',
    title: msg.virtualMachines(),
    to: '/',
  },
])

export { getRoutes, getMenu }
