import { combineReducers } from 'redux'

import config from './config'
import userMessages from './userMessages'
import vms from './vms'
import icons from './icons'
import options from './options'

import templates from './templates'
import clusters from './clusters'
import hosts from './hosts'
import operatingSystems from './operatingSystems'
import storageDomains from './storageDomains'
import dataCenters from './dataCenters'
import vnicProfiles from './vnicProfiles'
import activeRequests from './activeRequests'
import consoles from './consoles'
import { reducer as VmDialog } from '../components/VmDialog/reducer'
import { reducer as OptionsDialog } from '../components/OptionsDialog/reducer'
import NewDiskDialog from '../components/NewDiskDialog/reducers'
import pendingTasks from './pendingTasks'

export default combineReducers({
  config,
  vms,
  userMessages,
  icons,
  options,
  templates,
  clusters,
  operatingSystems,
  hosts,
  storageDomains,
  dataCenters,
  vnicProfiles,
  VmDialog,
  OptionsDialog,
  NewDiskDialog,
  pendingTasks,
  activeRequests,
  consoles,
})
