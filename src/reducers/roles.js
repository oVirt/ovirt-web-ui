import { fromJS } from 'immutable'

import { actionReducer } from './utils'
import { arrayToMap } from '_/helpers'
import { SET_ROLES } from '_/constants'

const initialState = fromJS({})

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

const roles = actionReducer(
  initialState,
  {
    [SET_ROLES] (state, { payload: { roles } }) {
      const idToRoleMap = arrayToMap(roles, role => role.id)
      for (const id of Object.keys(idToRoleMap)) {
        idToRoleMap[id].permitNames =
          idToRoleMap[id].permits.map(permit => permit.name)
      }
      return fromJS(idToRoleMap)
    },
  }
)

export default roles
export {
  initialState,
}
