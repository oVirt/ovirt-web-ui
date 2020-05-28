
import { locale as appLocale } from '_/intl'
import { localeCompare } from '_/helpers'

/*
 * Sort an Immutable List of Maps (set of disks) for display on the VmDisks list.
 * Drives Sorted by disk name.
 */
export function sortDisksForDisplay (disks, locale = appLocale) {
  return disks.sort((a, b) => { return localeCompare(a.get('name'), b.get('name'), locale) })
}
