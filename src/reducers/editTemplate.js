import { fromJS } from 'immutable'
import { actionReducer } from './utils'

const editTemplateReducer = actionReducer(fromJS({
  id: '',
  cluster: '',
  os: '',
  name: '',
  memory: '',
  cpu: '',
  errorMessage: '',
}), {
  UPDATE_EDIT_TEMPLATE (state, { payload: { template } }) {
    return fromJS(template)
  },
  UPDATE_EDIT_TEMPLATE_NAME (state, { payload: { name } }) {
    return state.set('name', fromJS(name))
  },
  UPDATE_EDIT_TEMPLATE_OS (state, { payload: { os } }) {
    return state.set('os', fromJS(os))
  },
  UPDATE_EDIT_TEMPLATE_DESCRIPTION (state, { payload: { description } }) {
    return state.set('description', fromJS(description))
  },
  UPDATE_EDIT_TEMPLATE_MEMORY (state, { payload: { memory } }) {
    return state.set('memory', fromJS(memory))
  },
  UPDATE_EDIT_TEMPLATE_CPU (state, { payload: { cpu } }) {
    return state.set('cpu', fromJS(cpu))
  },
  UPDATE_EDIT_TEMPLATE_ERROR_MESSAGE (state, { payload: { message } }) {
    return state.set('errorMessage', fromJS(message))
  },
})

export default editTemplateReducer
