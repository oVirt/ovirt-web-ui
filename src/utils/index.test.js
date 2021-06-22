/* eslint-env jest */
import { dividers } from './index'

describe('check utils functions', function () {
  it('check dividers function', function () {
    const testNumbers = [
      {
        input: 10,
        output: [1, 2, 5, 10],
      },
      {
        input: 18,
        output: [1, 2, 3, 6, 9, 18],
      },
      {
        input: 30,
        output: [1, 2, 3, 5, 6, 10, 15, 30],
      },
      {
        input: 71,
        output: [1, 71],
      },
      {
        input: 1,
        output: [1],
      },
    ]
    for (const n of testNumbers) {
      expect(dividers(n.input)).toEqual(n.output)
    }
  })
})
