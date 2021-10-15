// @flow
import type { RoleType } from '_/ovirtapi/types'

import * as C from '_/constants'

export function setRoles (roles: Array<RoleType>): Object {
  return {
    type: C.SET_ROLES,
    payload: {
      roles,
    },
  }
}
