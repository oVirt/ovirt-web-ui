// @flow

import produce from 'immer'
import { SET_DATA_CENTERS } from '_/constants'
import { arrayToMap } from '_/helpers'
import { actionReducer } from './utils'

type DataCenterStateType = {
  [dataCenterId: string]: Object
}

const initialState: DataCenterStateType = {}

const dataCentersReducers = actionReducer(initialState, {
  [SET_DATA_CENTERS]: produce((draft: DataCenterStateType, { payload }: { payload: Array<Object> }) => {
    return arrayToMap(payload, dataCenter => dataCenter.id)
  }),
})

export default dataCentersReducers
