/* eslint-env jest */

import { actionReducer } from './utils'

describe('actionReducer', () => {
  const counter = actionReducer(0, {
    INCREMENT (state, action) {
      return state + 1
    },
    DECREMENT (state, action) {
      return state - 1
    },
    SET_VALUE (state, action) {
      return action.value
    },
  })

  it('returns initial state on no action', () => {
    expect(counter(undefined, {})).toEqual(0)
  })

  it('utilizes initial state for known action', () => {
    expect(counter(undefined, { type: 'INCREMENT' })).toEqual(1)
  })

  it('utilizes current state for known action', () => {
    expect(counter(1, { type: 'INCREMENT' })).toEqual(2)
    expect(counter(4, { type: 'DECREMENT' })).toEqual(3)
  })

  it('preserves state on unknown actions', () => {
    expect(counter(42, { type: 'UNKNOWN' })).toEqual(42)
  })

  it('enables action handlers to consume action parameters', () => {
    expect(counter(5, { type: 'SET_VALUE', value: 7 })).toEqual(7)
  })
})
