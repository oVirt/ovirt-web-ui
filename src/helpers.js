export function valuesOfObject (obj) {
  return Object.keys(obj).map(key => obj[key])
}
