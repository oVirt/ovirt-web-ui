import React from 'react'

import AddVmButton from './components/VmDialog/AddVmButton'
import PageRouter from './components/PageRouter'
import { VmDetailToolbar, PoolDetailToolbar } from './components/Toolbar/index'
import VmsPage from './components/Pages/VmsPage'
import { VmDetailPage, PoolDetailPage, VmDialogPage } from './components/Pages/index'

/**
 * Function get vms object, and return routes object
 * Every route must has path, component that presentate page,
 * title (except top route), it can be function (get match parameter) or string,
 * toolbars as array of functions that get match parameter and return component.
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
        component: () =>
          (<VmsPage />),
        toolbars: [(match) => (<AddVmButton key='addbutton' />)],
      },
      {
        path: '/vm/add',
        exact: true,
        title: (match) => 'Add new VM',
        component: VmDialogPage,
        toolbars: [],
      },
      {
        path: '/vm/:id',
        title: (match) => {
          return vms.getIn(['vms', match.params.id, 'name'])
        },
        component: VmDetailPage,
        toolbars: [(match) => (<VmDetailToolbar match={match} key='vmaction' />)],
        routes: [
          {
            path: '/vm/:id/edit',
            component: VmDialogPage,
            title: 'Edit',
            toolbars: [],
          },
        ],
      },
      {
        path: '/pool/:id',
        title: (match) => {
          return vms.getIn(['pools', match.params.id, 'name'])
        },
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
    title: 'Virtual Machines',
    to: '/',
  },
])

export { getRoutes, getMenu }
