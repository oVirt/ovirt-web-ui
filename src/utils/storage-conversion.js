// @flow
import { convertValue as convertUnits } from './unit-conversion'

export const storageUnitTable = [
  { unit: 'TiB' },
  { unit: 'GiB', factor: 1024 },
  { unit: 'MiB', factor: 1024 },
  { unit: 'KiB', factor: 1024 },
  { unit: 'B', factor: 1024 },
]

type UnitType = 'TiB' | 'GiB' | 'MiB' | 'KiB' | 'B'

/**
 * Scale a single value, of the given unit, such that the new value, with a new unit,
 * falls in the range 0.1 .. 1024.
 */
export function convertValue (unit: UnitType, value: number): {
  unit: UnitType,
  value: number
} {
  return convertUnits(storageUnitTable, unit, value, 0.1, 1024)
}

/**
 * Scale an array of values, of the given unit, together such that the new values, with
 * a new unit, fall in the range 0.1 .. 1024 as close as possible.  Numbers that have
 * a large difference will not scale much.  A __0__ value will not prevent the other
 * numbers from scaling.
 */
export function convertValues (unit: UnitType, value: Array<number>): {
  unit: UnitType,
  value: Array<number>
} {
  return convertUnits(storageUnitTable, unit, value, 0.1, 1024)
}

/**
 * Scale a map of values, of the given unit, together such that the new values, with
 * a new unit, fall in the range 0.1 .. 1024 as close as possible.  Numbers that have
 * a large difference will not scale much.  A __0__ value will not prevent the other
 * numbers from scaling.
 */
export function convertValueMap (unit: UnitType, valueMap: { [string]: number }): {
  unit: UnitType,
  value: { [string]: number }
} {
  const keys: Array<string> = Object.keys(valueMap)
  const values: Array<number> = keys.map(key => valueMap[key])

  const { unit: newUnit, value: converted } = convertUnits(storageUnitTable, unit, values, 0.1, 1024)

  const result = { ...valueMap }
  keys.forEach((key, index) => { result[key] = converted[index] })
  return { unit: newUnit, value: result }
}
