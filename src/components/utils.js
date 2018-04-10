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

export function isRunning (status: string): boolean {
  console.log('---------- status: ', status)
  return ['wait_for_launch', 'up', 'powering_up', 'powering_down', 'migrating', 'paused'].includes(status)
}
