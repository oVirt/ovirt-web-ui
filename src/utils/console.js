// @flow
import * as C from '_/constants/console'
import { toJS } from '_/helpers'
import type { UiConsoleType } from '_/ovirtapi/types'

export function idFromType ({ vm, consoleType }: {vm: any, consoleType: UiConsoleType}) {
  // consoleId can be retrieved based on consoleType but not the opposite
  const {
    [C.VNC]: vncId,
    [C.SPICE]: spiceId,
  } = toJS(vm.get('consoles', []))
    .reduce((acc, { protocol, id }) => ({ ...acc, [protocol]: id }), {})
  switch (consoleType) {
    case C.RDP:
      return C.RDP
    case C.BROWSER_VNC:
    case C.NATIVE_VNC:
      return vncId
    case C.SPICE:
      return spiceId
    default:
      return undefined
  }
}

export const toUiConsole = (vncMode: typeof C.NO_VNC | typeof C.NATIVE, protocol: typeof C.VNC | typeof C.SPICE) => {
  if (protocol !== C.VNC) {
    return protocol
  }
  return vncMode === C.NATIVE ? C.NATIVE_VNC : C.BROWSER_VNC
}

export function isNativeConsole (consoleType: UiConsoleType): boolean {
  switch (consoleType) {
    case C.NATIVE_VNC:
    case C.RDP:
    case C.SPICE:
      return true

    default:
      return false
  }
}
