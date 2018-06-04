import { fromJS } from 'immutable'

import { actionReducer } from './utils'
import { SET_TEMPLATES } from '../constants'

const initialState = fromJS({})

const templates = actionReducer(initialState, {
  [SET_TEMPLATES] (state, { payload: templates }) {
    const idToTemplate = templates.reduce((accum, template) => {
      accum[template.id] = template
      return accum
    }, {})
    return fromJS(idToTemplate)
  },
})

export default templates
