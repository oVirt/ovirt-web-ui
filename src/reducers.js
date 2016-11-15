import { combineReducers } from 'redux'

import {
  ConfigReducer as config,
  UserMessages as userMessages,
  VmsReducer as vms,
  IconsReducer as icons,
  VisibilityReducer as visibility,
} from 'ovirt-ui-components'

function router (redirectUrl = '/', action) {
  switch (action.type) {
    case 'SET_REDIRECT_URL':
      return action.payload.redirectUrl
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
  router,
})
