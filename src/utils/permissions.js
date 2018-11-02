// @flow
import Selectors from '../selectors'
import type { ClusterType, PermissionType, VnicProfileType } from '../ovirtapi/types'

function checkUserPermit (permit: string, permits: Set<string>): boolean {
  return permits.has(permit)
}

export function canUserUseCluster (permits: Set<string>): boolean {
  return checkUserPermit('create_vm', permits)
}

export function canUserEditVm (permits: Set<string>): boolean {
  return checkUserPermit('edit_vm_properties', permits)
}

export function canUserUseVnicProfile (permits: Set<string>): boolean {
  return checkUserPermit('configure_vm_network', permits)
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
  return new Set(permits)
}
