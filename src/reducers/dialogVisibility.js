import Immutable from 'immutable'
import { actionReducer } from './utils'

const dialogVisibility = actionReducer(Immutable.fromJS({ showVmDialog: false, showVmDetail: false, showEditTemplate: false }), {
  OPEN_VM_DIALOG (state) {
    return state.set('showVmDialog', true)
  },
  CLOSE_VM_DIALOG (state) {
    return state.set('showVmDialog', false)
  },
  OPEN_VM_DETAIL (state) {
    return state.set('showVmDetail', true)
  },
  CLOSE_VM_DETAIL (state) {
    return state.set('showVmDetail', false)
  },
  OPEN_EDIT_TEMPLATE (state) {
    return state.set('showEditTemplate', true)
  },
  CLOSE_EDIT_TEMPLATE (state) {
    return state.set('showEditTemplate', false)
  },
})

export default dialogVisibility
