/* eslint-env jest */
import { round } from './round'

describe('rounding precision tests', function () {
  it('rounding to tens', function () {
    expect(round(12344, -1)).toEqual(12340)
    expect(round(12345, -1)).toEqual(12350)
    expect(round(12344, -2)).toEqual(12300)
    expect(round(12354, -2)).toEqual(12400)
    expect(round(12445, -3)).toEqual(12000)
    expect(round(12545, -3)).toEqual(13000)
  })

  it('rounding to integer', function () {
    expect(round(12345)).toEqual(12345)
    expect(round(12345, 0)).toEqual(12345)
    expect(round(12345.4, 0)).toEqual(12345)
    expect(round(12345.5, 0)).toEqual(12346)
  })

  it('rounding to decimals', function () {
    expect(round(1.2345, 1)).toEqual(1.2)
    expect(round(1.2567, 1)).toEqual(1.3)
    expect(round(1.2345, 2)).toEqual(1.23)
    expect(round(1.2356, 2)).toEqual(1.24)
    expect(round(1.2344, 3)).toEqual(1.234)
    expect(round(1.2345, 3)).toEqual(1.235)
  })
})

describe('round a number string', () => {
  test('string \'5.67\' gets rounded to 5.6', () => {
    expect(round('5.67', 1)).toEqual(5.7)
  })
})

describe('rounding an array', function () {
  it('to tens', function () {
    expect(round([ 12344, 12345, 12346, 12354 ], -1)).toEqual([ 12340, 12350, 12350, 12350 ])
  })

  it('to integer', function () {
    expect(round([ 123, 123.4, 123.5, 123.6 ], 0)).toEqual([ 123, 123, 124, 124 ])
  })

  it('to decimal', function () {
    expect(round([ 1.23, 1.24, 1.25, 1.26 ], 1)).toEqual([ 1.2, 1.2, 1.3, 1.3 ])
  })
})

describe('rounding an object', function () {
  it('to tens', function () {
    expect(round({ a: 12344, b: 12345, c: 12346, d: 12354 }, -1)).toEqual({ a: 12340, b: 12350, c: 12350, d: 12350 })
  })

  it('to integer', function () {
    expect(round({ a: 123, b: 123.4, c: 123.5, d: 123.6 }, 0)).toEqual({ a: 123, b: 123, c: 124, d: 124 })
  })

  it('to decimal', function () {
    expect(round({ a: 1.23, b: 1.24, c: 1.25, d: 1.26 }, 1)).toEqual({ a: 1.2, b: 1.2, c: 1.3, d: 1.3 })
  })
})

describe('rounding an array of objects', function () {
  it('to tens', function () {
    expect(round([
      { a: 12344, b: 12345 },
      { c: 12346, d: 12354 },
    ], -1))
      .toEqual([
        { a: 12340, b: 12350 },
        { c: 12350, d: 12350 },
      ])
  })
})

describe('rounding an object of arrays of number', function () {
  it('to decimal', function () {
    expect(round({
      a: [ 1.23, 1.24, 1.25 ],
      b: 2.67,
      c: [ 9.99, 8.76, 5.43 ],
    }, 1))
      .toEqual({
        a: [ 1.2, 1.2, 1.3 ],
        b: 2.7,
        c: [ 10.0, 8.8, 5.4 ],
      })
  })
})

describe('fail on bad inputs', function () {
  it('no arguments', function () {
    expect(() => round()).toThrowError(TypeError)
  })

  it('single null', function () {
    expect(() => round(null)).toThrowError(TypeError)
  })

  it('function input', function () {
    expect(() => round(() => {})).toThrowError(TypeError)
  })

  it('string input', function () {
    expect(() => round('ABC')).toThrowError(TypeError)
  })
})
