import { getOsHumanName } from '../components/utils'
import { enumMsg, msg } from '_/intl'

const getFieldValueMap = {
  name: (item) => item.get('name'),
  os: (item) => getOsHumanName(item.getIn(['os', 'type'])),
  status: (item) => enumMsg('VmStatus', item.get('status')),
}

export const sortFields = [
  {
    id: 'name',
    title: msg.name(),
    isNumeric: false,
  },
  {
    id: 'os',
    title: msg.operatingSystem(),
    isNumeric: false,
  },
  {
    id: 'status',
    title: msg.status(),
    isNumeric: false,
  },
]

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
