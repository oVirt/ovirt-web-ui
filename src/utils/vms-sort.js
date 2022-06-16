import { getOsHumanName } from '../components/utils'
import { enumMsg } from '_/intl'
import { localeCompare } from '_/helpers'

const getFieldValueMap = (msg) => ({
  name: (item) => item.get('name'),
  os: (item) => getOsHumanName(item.getIn(['os', 'type'])),
  status: (item) => enumMsg('VmStatus', item.get('status'), msg),
})

export const SortFields = {
  NAME: {
    id: 'name',
    isNumeric: false,
    messageDescriptor: { id: 'name' },
  },
  OS: {
    id: 'os',
    isNumeric: false,
    messageDescriptor: { id: 'operatingSystem' },
  },
  STATUS: {
    id: 'status',
    isNumeric: false,
    messageDescriptor: { id: 'status' },
  },
}

export const sortFunction = (sortType, locale, msg) =>
  (vmA, vmB) => {
    const vmAValue = getFieldValueMap(msg)[sortType.id](vmA)
    const vmBValue = getFieldValueMap(msg)[sortType.id](vmB)
    if (!vmAValue) {
      return sortType.isAsc ? -1 : 1
    }
    const compareValue = localeCompare(vmAValue, vmBValue, locale)
    return sortType.isAsc ? compareValue : -compareValue
  }
