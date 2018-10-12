// @flow
import { isNumber } from './unit-conversion'

export * from './permissions'
export * from './format'
export * from './round'
export * from './storage-conversion'
export { isNumber } from './unit-conversion'

export function flatMap<T, U> (array: Array<T>, mapper: (T) => Array<U>): Array<U> {
  return array.map(mapper)
    .reduce((accum, mapperResult) => [...accum, ...mapperResult], [])
}

export function parseGbToBytes (gbString: string): number | null {
  if (isNumber(gbString)) {
    const gbNumber = Number.parseInt(gbString, 10)
    return gbNumber * (1024 ** 3)
  }
  return null
}
