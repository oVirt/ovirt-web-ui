import { fromJS } from 'immutable'
import { actionReducer, removeMissingItems, removeItem } from './utils'

const initialState = fromJS({
  templates: {},
  loadInProgress: true,
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

  REMOVE_TEMPLATE (state, { payload: { id } }) {
    return removeItem({ state, subStateName: 'templates', idToRemove: id })
  },

  REMOVE_MISSING_TEMPLATES (state, { payload: { templateIdsToPreserve } }) {
    return removeMissingItems({ state, subStateName: 'templates', idsToPreserve: templateIdsToPreserve })
  },

})

export default templates
