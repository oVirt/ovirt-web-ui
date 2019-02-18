
export function arrayMatch (a1, a2) {
  if (
    (!Array.isArray(a1) || !Array.isArray(a2)) ||
    (a1.length !== a2.length)
  ) {
    return false
  }

  const difference = new Set(a1)
  for (let member of a2) {
    difference.delete(member)
  }

  return difference.size === 0
}
