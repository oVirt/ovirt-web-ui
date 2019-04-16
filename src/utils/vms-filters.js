import { enumMsg } from '_/intl'

const compareMap = {
  name: (item, filter) => !!filter.find(n => item.get('name').startsWith(n)),
  os: (item, filter) => item.getIn(['os', 'type']) === filter,
  status: (item, filter) => item.get('status') === filter,
}

export const mapFilterValues = {
  name: (value) => value,
  os: (value) => value,
  status: (value) => enumMsg('VmStatus', value),
}

export function filterVms (item, filters) {
  let res = true
  for (let name in filters) {
    if (compareMap[name]) {
      res &= compareMap[name](item, filters[name])
    }
  }
  return res
}
