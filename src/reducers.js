import { combineReducers } from 'redux'

import {
  ConfigReducer as config,
  UserMessages as userMessages,
  VmsReducer as vms,
  IconsReducer as icons,
  VisibilityReducer as visibility,
} from 'ovirt-ui-components'

export default combineReducers({
  config,
  vms,
  userMessages,
  icons,
  visibility,
})
