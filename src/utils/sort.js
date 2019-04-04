const getFieldValueMap = {
  name: (item) => item.get('name'),
  os: (item) => item.getIn(['os', 'type']),
  status: (item) => item.get('status'),
}

export const sortFields = [
  {
    id: 'name',
    title: 'Name',
    isNumeric: false,
  },
  {
    id: 'os',
    title: 'Operating System',
    isNumeric: false,
  },
  {
    id: 'status',
    title: 'Status',
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
