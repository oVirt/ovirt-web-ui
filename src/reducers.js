import { combineReducers } from 'redux'

import { ConfigReducer as config } from 'ovirt-ui-components'
import { UserMessages as userMessages } from 'ovirt-ui-components'
import { VmsReducer as vms } from 'ovirt-ui-components'
import { IconsReducer as icons } from 'ovirt-ui-components'

export default combineReducers({
  config,
  vms,
  userMessages,
  icons
})
