/* eslint-env jest */

import PropTypes from 'prop-types'
import { xor } from '_/propTypeExtras'

describe('xor PropType cross property validation', () => {
  const propTypesRest = [ 'prop', null, 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED' ]

  it('both exist, and self-verify', () => {
    const p1 = xor(PropTypes.string, 'p2')
    const p2 = xor(PropTypes.number, 'p1')

    const r1 = p1({ p1: 'foo', p2: 42 }, 'p1', 'Test', ...propTypesRest)
    const r2 = p2({ p1: 'foo', p2: 42 }, 'p2', 'Test', ...propTypesRest)

    expect(r1).toBeNull()
    expect(r2).toBeNull()
  })

  it('both exist, but one or the other does not self verify', () => {
    const p1 = xor(PropTypes.string, 'p2')
    const p2 = xor(PropTypes.number, 'p1')

    const r1 = p1({ p1: 42, p2: 'foo' }, 'p1', 'Test', ...propTypesRest)
    const r2 = p2({ p1: 42, p2: 'foo' }, 'p2', 'Test', ...propTypesRest)

    expect(r1).toEqual(new Error('Invalid prop `p1` of type `number` supplied to `Test`, expected `string`.'))
    expect(r2).toEqual(new Error('Invalid prop `p2` of type `string` supplied to `Test`, expected `number`.'))
  })

  it('one or the other exits, throw error', () => {
    const p1 = xor(PropTypes.string, 'p2')
    const p2 = xor(PropTypes.number, 'p1')

    const r1 = p1({ p1: 'foo' }, 'p1', 'Test', ...propTypesRest)
    const r2 = p2({ p2: 42 }, 'p2', 'Test', ...propTypesRest)

    expect(r1).toEqual(new Error(`Props 'p1' and 'p2' are both required for component 'Test'`))
    expect(r2).toEqual(new Error(`Props 'p2' and 'p1' are both required for component 'Test'`))
  })
})
