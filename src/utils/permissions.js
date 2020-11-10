// @flow
import Selectors from '_/selectors'
import type { ClusterType, PermissionType, VnicProfileType } from '_/ovirtapi/types'

function checkUserPermit (permit: string | Array<string>, permits: Set<string>): boolean {
  if (Array.isArray(permit)) {
    for (const p of permit) {
      if (!permits.has(p)) {
        return false
      }
    }
    return true
  } else {
    return permits.has(permit)
  }
}

export function canUserChangeCd (permits: Set<string>): boolean {
  return checkUserPermit('change_vm_cd', permits)
}

export function canUserUseCluster (permits: Set<string>): boolean {
  return checkUserPermit('create_vm', permits)
}

export function canUserUseTemplate (permits: Set<string>): boolean {
  return checkUserPermit('create_vm', permits)
}

export function canUserEditVm (permits: Set<string>): boolean {
  return checkUserPermit('edit_vm_properties', permits)
}

export function canUserUseVnicProfile (permits: Set<string>): boolean {
  return checkUserPermit('configure_vm_network', permits)
}

export function canUserManipulateSnapshots (permits: Set<string>): boolean {
  return checkUserPermit('manipulate_vm_snapshots', permits)
}

export function canUserUseStorageDomain (permits: Set<string>): boolean {
  return checkUserPermit([ 'create_disk', 'attach_disk_profile' ], permits)
}

export function canUserEditVmStorage (permits: Set<string>): boolean {
  return checkUserPermit('configure_vm_storage', permits)
}

export function canUserEditDisk (permits: Set<string>): boolean {
  return checkUserPermit('edit_disk_properties', permits)
}

/*
 * Return if any of the given clusters are available for use by the user (as defined
 * by `canUserUseCluster` above)
 */
export function canUserUseAnyClusters (clusters: Array<ClusterType>): boolean {
  return clusters.find(cluster => cluster.get('canUserUseCluster')) !== undefined
}

/*
 * Return if any of the given vNIC Profiles are available for use by the user (as defined
 * by `canUserUseVnicProfile` above)
 */
export function canUserUseAnyVnicProfile (vnicProfiles: Array<VnicProfileType>, dataCenterId: string): boolean {
  return vnicProfiles.find(vnicProfile =>
    vnicProfile.get('canUserUseProfile') && vnicProfile.getIn(['network', 'dataCenterId']) === dataCenterId
  ) !== undefined
}

export function getUserPermits (permissions: Array<PermissionType>): Set<string> {
  const userFilter = Selectors.getFilter()
  const userGroups = Selectors.getUserGroups()
  const userId = Selectors.getUserId()

  const permits = new Set()
  permissions.forEach((role) => {
    if (userFilter ||
      (
        (role.groupId && userGroups.includes(role.groupId)) ||
        (role.userId && role.userId === userId)
      )) {
      role.permits.map((permit) => permit.name).forEach((permit) => permits.add(permit))
    }
  })
  return permits
}
