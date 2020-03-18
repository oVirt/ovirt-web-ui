import { fromJS } from 'immutable'

import { actionReducer } from './utils'
import { arrayToMap } from '_/helpers'
import { SET_TEMPLATES } from '_/constants'

const initialState = fromJS({})

const templates = actionReducer(initialState, {
  [SET_TEMPLATES] (state, { payload: { templates } }) {
    const idToTemplate = arrayToMap(templates, template => template.id)
    return fromJS(idToTemplate)
  },
})

export default templates
export {
  initialState,
}
