import { fromJS } from 'immutable'

import { SET_DATA_CENTERS } from 'app-constants'
import { actionReducer } from './utils'

const initialState = fromJS([])

const storageDomainReducers = actionReducer(initialState, {
  [SET_DATA_CENTERS] (dataCentersState, { payload }) {
    return dataCentersState.splice(0, dataCentersState.size, ...payload)
  },
})

export default storageDomainReducers
