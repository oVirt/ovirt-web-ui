// @flow
import type { RoleType } from '_/ovirtapi/types'

import produce from 'immer'
import { SET_ROLES } from '_/constants'
import { arrayToMap } from '_/helpers'
import { actionReducer } from './utils'

type RoleStateType = RoleType & {
  permitNames: Array<string>
}

type RolesStateType = {
  [roleId: string]: RoleStateType
}

const initialState: RolesStateType = {}

/*
 * Store system roles (groups of permits) the App's user has access to:
 *   http://ovirt.github.io/ovirt-engine-api-model/master/#types/role
 *
 * roles: {
 *   'roleId': {
 *     administrative: boolean,
 *     id: uid,
 *     name: string,
 *     permits: [
 *        {
 *          administrative: boolean,
 *          id: uid,
 *          name: string,
 *        },
 *        ...
 *     ],
 *     permitNames: [ string, ... ] // plucked from role.permits.name
 *   },
 *   ...
 * }
 */

const roles = actionReducer(initialState, {
  [SET_ROLES]: produce((draft: RolesStateType, { payload: { roles } }: { payload: { roles: Array<RoleType> }}) => {
    const extendedRoles: Array<RoleStateType> = roles.map(role => ({
      ...role,
      permitNames: role.permits.map(permit => permit.name),
    }))

    return arrayToMap(extendedRoles, role => role.id)
  }),
})

export default roles
export {
  initialState,
}
