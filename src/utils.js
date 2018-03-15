// @flow

export function flatMap<T, U> (array: Array<T>, mapper: (T) => Array<U>): Array<U> {
  return array.map(mapper)
    .reduce((accum, mapperResult) => [...accum, ...mapperResult], [])
}

export function parseGbToBytes (gbString: string): number | null {
  const parsedGb = Number.parseInt(gbString)
  if (Number.isNaN(parsedGb)) {
    return null
  }
  return parsedGb * (1024 ** 3)
}
