// @flow

export function getVmIcon (icons: Object, operatingSystems: Array<Object>, vm: Object): Object {
  return icons.get(getVmIconId(operatingSystems, vm))
}

export function isValidOsIcon (operatingSystems: Array<Object>, iconId: string): boolean {
  return !!operatingSystems.find((v, k) => v.getIn(['icons', 'large', 'id']) === iconId)
}

export function getVmIconId (operatingSystems: Array<Object>, vm: Object): Object {
  let iconId = vm.getIn(['icons', 'large', 'id'])

  // api can reference old os icon, otherwise use custom icon
  if (isValidOsIcon(operatingSystems, iconId)) {
    // get current os icon
    const vmOs = operatingSystems.find((v, k) => v.get('name') === vm.getIn(['os', 'type']))
    if (vmOs) {
      iconId = vmOs.getIn(['icons', 'large', 'id'])
    }
  }
  return iconId
}
