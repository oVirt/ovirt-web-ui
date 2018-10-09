// @flow
import Selectors from '../selectors'
import type { ClusterType, PermissionType } from '../ovirtapi/types'

function checkPermissions (permission: string, permissions: Array<PermissionType>): boolean {
  const userFilter = Selectors.getFilter()
  const userGroups = Selectors.getUserGroups()
  const userId = Selectors.getUserId()

  return permissions.find((role) => (
    (userFilter ||
      (
        (role.groupId && userGroups.includes(role.groupId)) ||
        (role.userId && role.userId === userId)
      )
    ) &&
    role.permits.find((permit) => permit.name === permission) !== undefined
  )) !== undefined
}

export function canUserUseCluster (permissions: Array<PermissionType>): boolean {
  return checkPermissions('create_vm', permissions)
}

export function canUserEditVm (permissions: Array<PermissionType>): boolean {
  return checkPermissions('edit_vm_properties', permissions)
}

/*
 * Return if any of the given clusters are available for use by the cluster (as defined
 * by `canUserUseCluster` above)
 */
export function canUserUseAnyClusters (clusters: Array<ClusterType>): boolean {
  return clusters.find(cluster => cluster.get('canUserUseCluster')) !== undefined
}
