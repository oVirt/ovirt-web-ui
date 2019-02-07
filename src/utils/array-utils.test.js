/* eslint-env jest */
import { arrayMatch } from './array-utils'

describe('test array utilities', () => {
  test('arrayMatch, positive matches', () => {
    expect(arrayMatch([], [])).toBeTruthy()
    expect(arrayMatch([ 1, 2, 3 ], [ 1, 2, 3 ])).toBeTruthy()
    expect(arrayMatch([ 'A', 'B', 'C' ], [ 'A', 'B', 'C' ])).toBeTruthy()
  })

  test('arrayMatch, bad inputs', () => {
    expect(arrayMatch()).toBeFalsy()
    expect(arrayMatch([])).toBeFalsy()
    expect(arrayMatch('A')).toBeFalsy()
    expect(arrayMatch('A', 'A')).toBeFalsy()
    expect(arrayMatch(42, 42)).toBeFalsy()
  })

  test('arrayMatch, negative matches', () => {
    expect(arrayMatch([ 1, 2, 3 ], [])).toBeFalsy()
    expect(arrayMatch([], [ 1, 2, 3 ])).toBeFalsy()
    expect(arrayMatch([ 1, 2 ], [ 1, 2, 3 ])).toBeFalsy()
    expect(arrayMatch([ 'A', 'B', 'C' ], [ 1, 2, 3 ])).toBeFalsy()
  })
})
