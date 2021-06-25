/* eslint-env jest */
// adapted from: https://github.com/oVirt/ovirt-engine-dashboard/blob/master/src/utils/unit-conversion-test.js

import { storageUnitTable } from './storage-conversion'
import { convertUnits } from './unit-conversion'

describe('convertUnits', function () {
  it('scales down the unit when value is too small', function () {
    expect(convertUnits(storageUnitTable, 'TiB', 0.001)).toEqual({
      unit: 'GiB', value: 0.001 * 1024,
    })
    expect(convertUnits(storageUnitTable, 'TiB', 0.000001)).toEqual({
      unit: 'MiB', value: 0.000001 * (1024 ** 2),
    })
    expect(convertUnits(storageUnitTable, 'GiB', 0.001)).toEqual({
      unit: 'MiB', value: 0.001 * 1024,
    })
  })

  it('scales down the unit when value is too small (custom minimum thresholds)', function () {
    expect(convertUnits(storageUnitTable, 'TiB', 0.0499, 0.05)).toEqual({
      unit: 'GiB', value: 0.0499 * 1024,
    })
    expect(convertUnits(storageUnitTable, 'TiB', 0.051, 0.05)).toEqual({
      unit: 'TiB', value: 0.051,
    })
  })

  it('scales up the unit when value is too big', function () {
    expect(convertUnits(storageUnitTable, 'MiB', 10000)).toEqual({
      unit: 'GiB', value: 10000 / 1024,
    })
    expect(convertUnits(storageUnitTable, 'MiB', 10000000)).toEqual({
      unit: 'TiB', value: 10000000 / (1024 ** 2),
    })
    expect(convertUnits(storageUnitTable, 'GiB', 10000)).toEqual({
      unit: 'TiB', value: 10000 / 1024,
    })
  })

  it('returns the same unit and value when unit is not in the table', function () {
    expect(convertUnits(storageUnitTable, 'foo', 1)).toEqual({
      unit: 'foo', value: 1,
    })
  })

  it('scale all values down 1 unit', function () {
    expect(convertUnits(storageUnitTable, 'TiB', [0.0123, 0.0456])).toEqual({
      unit: 'GiB',
      value: [0.0123 * 1024, 0.0456 * 1024],
    })
  })

  it('scale all values up 2 units', function () {
    expect(convertUnits(storageUnitTable, 'MiB', [(1 * (1024 ** 2)), (2 * (1024 ** 2))])).toEqual({
      unit: 'TiB',
      value: [1, 2],
    })
  })

  it('no scaling, 1 value in the array is in range', function () {
    expect(convertUnits(storageUnitTable, 'TiB', [1.01, 0.02])).toEqual({
      unit: 'TiB',
      value: [1.01, 0.02],
    })
  })

  it('returns the same unit and values when unit is not in the table', function () {
    expect(convertUnits(storageUnitTable, 'foo', [1, 2, 3])).toEqual({
      unit: 'foo', value: [1, 2, 3],
    })
  })
})
