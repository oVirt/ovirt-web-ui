// @flow
import Selectors from '../selectors'
import type { ClusterType, PermissionType } from '../ovirtapi/types'

function checkUserPermit (permit: string, permits: Array<string>): boolean {
  return permits.includes(permit)
}

export function canUserUseCluster (permits: Array<string>): boolean {
  return checkUserPermit('create_vm', permits)
}

export function canUserEditVm (permits: Array<string>): boolean {
  return checkUserPermit('edit_vm_properties', permits)
}

/*
 * Return if any of the given clusters are available for use by the cluster (as defined
 * by `canUserUseCluster` above)
 */
export function canUserUseAnyClusters (clusters: Array<ClusterType>): boolean {
  return clusters.find(cluster => cluster.get('canUserUseCluster')) !== undefined
}

export function getUserPermits (permissions: Array<PermissionType>): Array<string> {
  const userFilter = Selectors.getFilter()
  const userGroups = Selectors.getUserGroups()
  const userId = Selectors.getUserId()
  let permits = []
  permissions.forEach((role) => {
    if (userFilter ||
      (
        (role.groupId && userGroups.includes(role.groupId)) ||
        (role.userId && role.userId === userId)
      )) {
      permits = [...permits, ...role.permits.map((permit) => permit.name)]
    }
  })
  return permits
}
