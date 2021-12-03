// @flow
import * as C from '_/constants/console'
import { toJS, isWindows } from '_/helpers'
import type { UiConsoleType } from '_/ovirtapi/types'

export function idFromType ({ vm, consoleType }: {vm: any, consoleType: UiConsoleType}): ?string {
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

export const toUiConsole = (vncMode: typeof C.NO_VNC | typeof C.NATIVE, protocol: typeof C.VNC | typeof C.SPICE): UiConsoleType => {
  if (protocol === C.SPICE) {
    return C.SPICE
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

export function getConsoles ({
  vmConsoles = [],
  vmOsType,
  websocket,
  defaultVncMode,
  preferredConsole,
}: any): any {
  const vncConsole = vmConsoles.find(({ protocol }) => protocol === C.VNC)
  const spiceConsole = vmConsoles.find(({ protocol }) => protocol === C.SPICE)
  const hasRdp = isWindows(vmOsType)
  const consoles = []

  if (vncConsole) {
    const vncModes = [{
      priority: 0,
      protocol: C.VNC,
      consoleType: C.NATIVE_VNC,
      shortTitle: { id: 'vncConsole' },
    },
    {
      priority: 0,
      consoleType: C.BROWSER_VNC,
      shortTitle: { id: 'vncConsoleBrowser' },
      actionDisabled: !websocket,
    }]

    if (defaultVncMode === C.NO_VNC) {
      vncModes.reverse()
    }
    consoles.push(...vncModes)
  }

  if (spiceConsole) {
    consoles.push({
      priority: 0,
      protocol: C.SPICE,
      consoleType: C.SPICE,
      shortTitle: { id: 'spiceConsole' },
    })
  }

  if (hasRdp) {
    consoles.push({
      priority: 0,
      protocol: C.RDP,
      consoleType: C.RDP,
      shortTitle: { id: 'remoteDesktop' },
    })
  }

  return consoles
    .map(({ consoleType, ...props }) => ({ ...props, consoleType, priority: consoleType === preferredConsole ? 1 : 0 }))
    .sort((a, b) => b.priority - a.priority)
}
