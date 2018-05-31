import { fromJS } from 'immutable'

import { actionReducer } from './utils'
import { arrayToMap } from '../helpers'
import { SET_TEMPLATES } from '../constants'

const initialState = fromJS({})

const templates = actionReducer(initialState, {
  [SET_TEMPLATES] (state, { payload: templates }) {
    const idToTemplate = arrayToMap(templates, template => template.id)
    return fromJS(idToTemplate)
  },
})

export default templates
export {
  initialState,
}
