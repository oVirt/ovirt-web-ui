import * as Storage from './storage-conversion'

describe('storage size conversions', () => {
  test('single value, start from byte (B)', () => {
    const results = Storage.convertValue('B', 1024 * 1024 * 1024)
    expect(results).toEqual({ unit: 'GiB', value: 1 })
  })

  test('paired values, start from byte (B)', () => {
    const results = Storage.convertValues('B', [3 * 1024 * 1024, 7.5 * 1024 * 1024])
    expect(results).toEqual({ unit: 'MiB', value: [3, 7.5] })
  })

  test('value map, start from byte (B)', () => {
    const results = Storage.convertValueMap('B', {
      a: 47185920,
      b: 367001600,
      c: 9663676416,
    })
    expect(results).toEqual({
      unit: 'MiB',
      value: {
        a: 45,
        b: 350,
        c: 9216,
      },
    })
  })

  test('set of values to scale up (higher magnitude), one as 0 the rest are large', () => {
    const results = Storage.convertValues('B', [
      0,
      2.5 * (1024 ** 3),
      5 * (1024 ** 3),
    ])
    expect(results).toEqual({
      unit: 'GiB',
      value: [
        0,
        2.5,
        5,
      ],
    })
  })

  test('set of values to be scaled down (lower magnitude)', () => {
    const results = Storage.convertValues('GiB', [
      0,
      0.0123,
      0.0456,
    ])
    expect(results).toEqual({
      unit: 'MiB',
      value: [
        0,
        0.0123 * 1024,
        0.0456 * 1024,
      ],
    })
  })
})
