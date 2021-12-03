// @flow

import type { DiskType } from '../ovirtapi/types'
import {
  CREATE_DISK_FOR_VM,
  REMOVE_DISK,
  EDIT_VM_DISK,
} from '../constants'

export function createDiskForVm ({ vmId, disk }: { vmId: string, disk: DiskType }): any {
  return {
    type: CREATE_DISK_FOR_VM,
    payload: {
      vmId,
      disk,
    },
  }
}

export function removeDisk ({ diskId, vmToRefreshId }: { diskId: string, vmToRefreshId?: string }): any {
  return {
    type: REMOVE_DISK,
    payload: {
      diskId,
      vmToRefreshId,
    },
  }
}

export function editDiskOnVm ({ vmId, disk }: { vmId: string, disk: DiskType }): any {
  return {
    type: EDIT_VM_DISK,
    payload: {
      vmId,
      disk,
    },
  }
}
