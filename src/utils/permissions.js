// @flow
import Selectors from '../selectors'
import type { PermissionType } from '../ovirtapi/types'

function checkPermissions (allowedPermissions: Array<string>, permissions: Array<PermissionType>): boolean {
  return permissions.find((role) => (
    (Selectors.getFilter() || (
      (role.groupId && Selectors.getUserGroups().includes(role.groupId)) ||
      (role.userId && role.userId === Selectors.getUserId())
    )) && allowedPermissions.includes(role.name)
  )) !== undefined
}

export function canUserUseCluster (permissions: Array<PermissionType>): boolean {
  const allowedPermissions = [
    'VmCreator',
    'PowerUserRole',
    'ClusterAdmin',
    'DataCenterAdmin',
    'UserVmManager',
    'UserVmRunTimeManager',
    'SuperUser',
  ]
  return checkPermissions(allowedPermissions, permissions)
}

export function canUserEditVm (permissions: Array<PermissionType>): boolean {
  const allowedPermissions = [
    'ClusterAdmin',
    'DataCenterAdmin',
    'UserVmManager',
    'UserVmRunTimeManager',
    'SuperUser',
  ]
  return checkPermissions(allowedPermissions, permissions)
}
