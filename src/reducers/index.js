import { combineReducers } from 'redux'

import config from './config'
import userMessages from './userMessages'
import vms from './vms'
import icons from './icons'
import visibility from './visibility'

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
