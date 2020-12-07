import { combineReducers } from 'redux'

import config from './config'
import vms from './vms'
import userMessages from './userMessages'
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
import pendingTasks from './pendingTasks'
import roles from './roles'

import NewDiskDialog from '../components/NewDiskDialog/reducers'

export default combineReducers({
  config,
  vms,
  userMessages,
  icons,
  options,
  templates,
  clusters,
  hosts,
  operatingSystems,
  storageDomains,
  dataCenters,
  vnicProfiles,
  activeRequests,
  consoles,
  pendingTasks,
  roles,

  NewDiskDialog,
})
