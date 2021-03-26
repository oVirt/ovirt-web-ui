import { getOsHumanName } from '../components/utils'
import { enumMsg } from '_/intl'

const getFieldValueMap = {
  name: (item) => item.get('name'),
  os: (item) => getOsHumanName(item.getIn(['os', 'type'])),
  status: (item) => enumMsg('VmStatus', item.get('status')),
}

export const SortFields = {
  NAME: {
    id: 'name',
    isNumeric: false,
    toLabel: (msg) => msg.name(),
  },
  OS: {
    id: 'os',
    isNumeric: false,
    toLabel: (msg) => msg.operatingSystem(),
  },
  STATUS: {
    id: 'status',
    isNumeric: false,
    toLabel: (msg) => msg.status(),
  },
}

export const sortFunction = (sortType) =>
  (vmA, vmB) => {
    const vmAValue = getFieldValueMap[sortType.id](vmA)
    const vmBValue = getFieldValueMap[sortType.id](vmB)
    if (!vmAValue) {
      return sortType.isAsc ? -1 : 1
    }
    const compareValue = vmAValue.localeCompare(vmBValue)
    return sortType.isAsc ? compareValue : -compareValue
  }
