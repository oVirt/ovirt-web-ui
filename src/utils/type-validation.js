
/**
 * Determine if __n__ is actually a number.
 */
export function isNumber (n) {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

/**
 * Test if __n__ is a number and fits the range `minExclusive < n <= maxInclusive`.
 */
export function isNumberInRange (n, minExclusive, maxInclusive) {
  return isNumber(n) && n > minExclusive && n <= maxInclusive
}
