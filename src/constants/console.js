// @flow

/**
* use typed constant workaround: typeof FOO === FOO
* this allows to use string constants in type definitions i.e.
* type A = typeof FOO | typeof BAR
**/
export const OPEN_IN_PROGRESS: 'OPEN_IN_PROGRESS' = 'OPEN_IN_PROGRESS'
export const INIT_CONSOLE: 'INIT_CONSOLE' = 'INIT_CONSOLE'
export const DOWNLOAD_CONSOLE: 'DOWNLOAD_CONSOLE' = 'DOWNLOAD_CONSOLE'
export const DISCONNECTED_CONSOLE: 'DISCONNECTED_CONSOLE' = 'DISCONNECTED_CONSOLE'

export const OPEN_CONSOLE = 'OPEN_CONSOLE'
export const ADD_CONSOLE_ERROR = 'ADD_CONSOLE_ERROR'
export const DISMISS_CONSOLE_ERROR = 'DISMISS_CONSOLE_ERROR'

export const CONSOLE_IN_USE: 'IN_USE' = 'IN_USE'
export const CONSOLE_LOGON: 'LOGON' = 'LOGON'

// console protocols
export const VNC: 'vnc' = 'vnc'
export const SPICE: 'spice' = 'spice'
export const RDP: 'rdp' = 'rdp'

// VNC modes sent from the backend (config property ClientModeVncDefault)
export const NO_VNC: 'NoVnc' = 'NoVnc'
export const NATIVE: 'Native' = 'Native'

// UI console types (for spice and rdp protocol name is used directly)
export const BROWSER_VNC: 'BrowserVnc' = 'BrowserVnc'
export const NATIVE_VNC: 'NativeVnc' = 'NativeVnc'
