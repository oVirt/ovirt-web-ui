import { fromJS } from 'immutable'
import { actionReducer, removeMissingItems } from './utils'

const initialState = fromJS({
  templates: {},
})

const templates = actionReducer(initialState, {
  ADD_TEMPLATES (state, { payload: { templates } }) {
    const updates = {}
    templates.forEach(template => {
      updates[template.id] = template
    })
    const imUpdates = fromJS(updates)
    return state.mergeIn(['templates'], imUpdates)
  },

  REMOVE_MISSING_TEMPLATES (state, { payload: { templateIdsToPreserve } }) {
    return removeMissingItems({ state, subStateName: 'templates', idsToPreserve: templateIdsToPreserve })
  },

})

export default templates
