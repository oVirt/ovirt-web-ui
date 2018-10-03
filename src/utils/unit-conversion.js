// adapted from: https://github.com/oVirt/ovirt-engine-dashboard/blob/master/src/utils/unit-conversion.js

export function isNumber (n) {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

export function convertValue (unitTable = [], unit, value, minThreshold = 0.1, maxThreshold = 1024) {
  let newUnit = unit
  let newValue
  if (Array.isArray(value)) {
    newValue = value.slice(0)
  } else if (isNumber(value)) {
    newValue = [ value ]
  } else {
    throw new TypeError('value must be a number or an array')
  }

  const availableUnits = unitTable.map((obj) => obj.unit)
  if (availableUnits.includes(unit)) {
    const reversedUnitTable = unitTable.slice(0).reverse()

    // scale all values down (coarse to fine), but only if they can all scale with the minThreshold
    unitTable.forEach((obj, index) => {
      const leMinThreshold = newValue.reduce((res, val) => res && (val === 0 || val <= minThreshold), true)
      if (newUnit === obj.unit && leMinThreshold && index + 1 < unitTable.length) {
        const nextObj = unitTable[index + 1]
        newUnit = nextObj.unit
        newValue = newValue.map((val) => val * nextObj.factor)
      }
    })

    // scale each value up (fine to coarse), but only if they can all scale with the maxThreshold
    reversedUnitTable.forEach((obj, index) => {
      const geMaxThreshold = newValue.reduce((res, val) => res && (val === 0 || val >= maxThreshold), true)
      if (newUnit === obj.unit && geMaxThreshold && index + 1 < reversedUnitTable.length) {
        const nextObj = reversedUnitTable[index + 1]
        newUnit = nextObj.unit
        newValue = newValue.map((val) => val / obj.factor)
      }
    })
  }

  return { unit: newUnit, value: Array.isArray(value) ? newValue : newValue[0] }
}
