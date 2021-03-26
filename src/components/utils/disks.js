
import { localeCompare } from '_/helpers'

/*
 * Sort an Immutable List of Maps (set of disks) for display on the VmDisks list.
 * Drives Sorted by disk name.
 */
export function sortDisksForDisplay (disks, locale) {
  return disks.sort((a, b) => { return localeCompare(a.get('name'), b.get('name'), locale) })
}

// Sort the Disks and NICs for display in the CreateVmWizard
// Sort the template based ones first, then by name
export function sortNicsDisks (objs, locale) {
  return objs
    .sort((a, b) =>
      a.isFromTemplate && !b.isFromTemplate ? -1
        : !a.isFromTemplate && b.isFromTemplate ? 1
          : localeCompare(a.name, b.name, locale)
    )
}
