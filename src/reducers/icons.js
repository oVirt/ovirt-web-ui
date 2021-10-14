// @flow

import produce from 'immer'
import { UPDATE_ICONS } from '_/constants'
import { actionReducer } from './utils'

type IconsStateType = {
  [iconId: string]: Object
}

const initialState: IconsStateType = {}

const icons = actionReducer(initialState, {
  [UPDATE_ICONS]: produce((draft: IconsStateType, { payload: { icons } }) => {
    icons.forEach(icon => {
      draft[icon.id] = icon
    })
  }),
})

export default icons
export {
  initialState,
}
