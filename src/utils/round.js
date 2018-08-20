import { isNumber } from './unit-conversion'

/*
 * Round a number, an array of numbers, or an Object map of numbers to the specified
 * precision (negative precision is tens places, 0 is to an integer, positive precision
 * is to decimal places).
 */
export function round (number, precision = 0) {
  let rounded

  if (isNumber(number)) {
    const factor = Math.pow(10, precision)
    const temp = number * factor
    const roundedTemp = Math.round(temp)
    rounded = roundedTemp / factor
  } else if (Array.isArray(number)) {
    rounded = number.map(n => round(n, precision))
  } else if (number !== null && typeof number === 'object') {
    rounded = Object.keys(number).reduce((acc, key) => { acc[key] = round(number[key], precision); return acc }, {})
  } else {
    throw new TypeError('number must be a number, an array of numbers or an object of numbers')
  }

  return rounded
}
