// @flow

import Selectors from '../selectors'

/**
 * @param osName guest OS code name, e.g. 'rhel_7x64'
 * @return human friendly guest OS name, e.g. 'Red Hat Enterprise Linux 7.x x64'
 */
export function getOsHumanName (osName: string): string {
  const os = Selectors.getOperatingSystemByName(osName)
  return os && os.get('description') || osName
}

export function getVmIcon (icons: Object, operatingSystems: Array<Object>, vm: Object): Object {
  let iconId = vm.getIn(['icons', 'large', 'id'])

  const validOsIcon = operatingSystems.find((v, k) => v.getIn(['icons', 'large', 'id']) === iconId)
  // api can reference old os icon, otherwise use custom icon
  if (validOsIcon) {
    // get current os icon
    const vmOs = operatingSystems.find((v, k) => v.get('name') === vm.getIn(['os', 'type']))
    if (vmOs) {
      iconId = vmOs.getIn(['icons', 'large', 'id'])
    }
  }
  return icons.get(iconId)
}

export function isRunning (status: string): boolean {
  console.log('---------- status: ', status)
  return ['wait_for_launch', 'up', 'powering_up', 'powering_down', 'migrating', 'paused'].includes(status)
}

export function transformArrayToObject (arr: Array<Object>): Object {
  const result = {}
  for (let i = 0; i < arr.length; i++) {
    result[arr[i].id] = arr[i]
  }
  return result
}
