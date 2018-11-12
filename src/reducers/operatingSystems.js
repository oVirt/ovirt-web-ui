import { fromJS } from 'immutable'

import { arrayToMap } from 'app-helpers'
import { SET_OPERATING_SYSTEMS } from 'app-constants'
import { actionReducer } from './utils'

const initialState = fromJS({})
const operatingSystems = actionReducer(initialState, {
  [SET_OPERATING_SYSTEMS] (state, { payload: operatingSystems }) {
    const idToOperatingSystem = arrayToMap(operatingSystems, os => os.id)
    return fromJS(idToOperatingSystem)
  },
})

export default operatingSystems
export {
  initialState,
}
