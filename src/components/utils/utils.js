// @flow
import Selectors from '_/selectors'

/**
 * @param osName guest OS code name, e.g. 'rhel_7x64'
 * @return human friendly guest OS name, e.g. 'Red Hat Enterprise Linux 7.x x64'
 */
export function getOsHumanName (osName: string): string {
  const os = Selectors.getOperatingSystemByName(osName)
  return (os && os.get('description')) || osName
}

export function isRunning (status: string): boolean {
  return ['wait_for_launch', 'up', 'powering_up', 'powering_down', 'migrating', 'paused', 'reboot_in_progress'].includes(status)
}

export function getMinimizedString (str: string, maxChar: number): string {
  return str.length > maxChar ? `${str.substring(0, maxChar - 3)}...` : str
}

export function escapeHtml (s: string): string {
  var div = document.createElement('div')
  div.appendChild(document.createTextNode(s))
  return div.innerHTML
}

/**
 * Given a name, mask all spaces and non-alphanumeric characters as '_'.
 */
export function maskForElementId (name: string): string {
  return name && name.replace(/[\W\s]+/g, '_')
}
