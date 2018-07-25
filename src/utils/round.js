/*
 * Round a number to the specified precision (negative precision is tens places,
 * 0 is to an integer, positive precision is to decimal places).
 */
export function round (number, precision = 0) {
  const factor = Math.pow(10, precision)
  const temp = number * factor
  const roundedTemp = Math.round(temp)
  return roundedTemp / factor
}
