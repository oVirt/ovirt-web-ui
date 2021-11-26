
const compareMap = {
  name: (item, filters = []) => !filters?.length || !!filters.find(n => item.get('name').toUpperCase().includes(n.toUpperCase())),
  os: (item, filters) => !filters?.length || !!filters.find(type => type === item.getIn(['os', 'type'])),
  status: (item, filters) => !filters?.length || !!filters.find(status => status === item.get('status')),
}

export function filterVms (item, filters) {
  let res = true
  for (const name in filters) {
    if (compareMap[name]) {
      res &= compareMap[name](item, filters[name])
    }
  }
  return res
}
