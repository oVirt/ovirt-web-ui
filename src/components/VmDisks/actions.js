// @flow
/* eslint-disable flowtype/require-return-type */

import { REMOVE_DISK } from './constants'

export function removeDisk (diskId: string, vmToRefreshId?: string) {
  return {
    type: REMOVE_DISK,
    payload: {
      diskId,
      vmToRefreshId,
    },
  }
}
