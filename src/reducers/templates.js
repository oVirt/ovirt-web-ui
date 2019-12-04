import { fromJS } from 'immutable'

import { actionReducer } from './utils'
import { arrayToMap } from '_/helpers'
import { SET_TEMPLATES, TEMPLATE_SET_DISKS, TEMPLATE_SET_NICS } from '_/constants'

const initialState = fromJS({})

const templates = actionReducer(initialState, {
  [SET_TEMPLATES] (state, { payload: { templates } }) {
    const idToTemplate = arrayToMap(templates, template => template.id)
    return fromJS(idToTemplate)
  },
  [TEMPLATE_SET_NICS] (state, { payload: { templateId, nics } }) {
    const update =
      state.has(templateId)
        ? state.setIn([ templateId, 'nics' ], fromJS(nics))
        : state

    return update
  },
  [TEMPLATE_SET_DISKS] (state, { payload: { templateId, disks } }) {
    const update =
      state.has(templateId)
        ? state.setIn([ templateId, 'disks' ], fromJS(disks))
        : state

    return update
  },
})

export default templates
export {
  initialState,
}
