// @flow
import type { VmSessionsType } from '_/ovirtapi/types'
import { isNumber } from './type-validation'
import { VNC, NATIVE, SPICE, NO_VNC, NATIVE_VNC, BROWSER_VNC } from '_/constants/console'

export * from './array-utils'
export * from './format'
export * from './permissions'
export * from './round'
export * from './storage-conversion'
export * from './type-validation'
export * from './vms-filters'
export * from './vms-sort'

export function flatMap<T, U> (array: Array<T>, mapper: (T) => Array<U>): Array<U> {
  return array.map(mapper)
    .reduce((accum, mapperResult) => [...accum, ...mapperResult], [])
}

export function parseGbToBytes (gbString: string): number | null {
  if (isNumber(gbString)) {
    const gbNumber = Number.parseInt(gbString, 10)
    return gbNumber * (1024 ** 3)
  }
  return null
}

export function doesVmSessionExistForUserId (sessions: Array<VmSessionsType>, userId: string): boolean {
  return sessions.find(s => s.user.id === userId) !== undefined
}

export function dividers (num: number): Array<number> {
  const divs = [1]
  for (let i = 2; i < num; i++) {
    if (num % i === 0) {
      divs.push(i)
    }
  }
  if (num > 1) {
    divs.push(num)
  }
  return divs
}

export const toUiConsole = (vncMode: NO_VNC | NATIVE, protocol: VNC | SPICE) => {
  if (protocol !== VNC) {
    return protocol
  }
  return vncMode === NATIVE ? NATIVE_VNC : BROWSER_VNC
}
