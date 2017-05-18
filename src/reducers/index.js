import { combineReducers } from 'redux'

import config from './config'
import userMessages from './userMessages'
import vms from './vms'
import icons from './icons'
import visibility from './visibility'
import options from './options'

import templates from './templates'
import clusters from './clusters'
import route from './route'
import operatingSystems from './operatingSystems'
import { reducer as VmAction } from '../components/VmActions/reducer'
import { reducer as VmDialog } from '../components/VmDialog/reducer'

function router (redirectUrl = '/', action) {
  switch (action.type) {
    default:
      return redirectUrl
  }
}

export default combineReducers({
  config,
  vms,
  userMessages,
  icons,
  visibility,
  options,
  router,
  templates,
  clusters,
  operatingSystems,
  route,
  VmAction,
  VmDialog,
})
