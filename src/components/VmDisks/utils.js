
import { locale as appLocale } from '../../intl'

function localeCompare (a, b, locale = appLocale) {
  return a.localeCompare(b, locale, { numeric: true })
}

/*
 * Sort an Immutable List of Maps (set of disks) for display on the VmDisks list.
 * Bootable drives sort first, then sorted number aware alphabetically.
 */
export function sortDisksForDisplay (disks, locale = appLocale) {
  return disks.sort((a, b) => {
    const aBoot = a.get('bootable')
    const bBoot = b.get('bootable')

    return aBoot && !bBoot ? -1
      : !aBoot && bBoot ? 1
        : localeCompare(a.get('name'), b.get('name'), locale)
  })
}
