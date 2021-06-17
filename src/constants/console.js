export const INIT_CONSOLE = 'INIT_CONSOLE'
export const DOWNLOAD_CONSOLE = 'DOWNLOAD_CONSOLE'
export const DISCONNECTED_CONSOLE = 'DISCONNECTED_CONSOLE'

export const OPEN_CONSOLE_MODAL = 'OPEN_CONSOLE_MODAL'
export const CLOSE_CONSOLE_MODAL = 'CLOSE_CONSOLE_MODAL'
export const SET_IN_USE_CONSOLE_MODAL_STATE = 'SET_IN_USE_CONSOLE_MODAL_STATE'
export const SET_LOGON_CONSOLE_MODAL_STATE = 'SET_LOGON_CONSOLE_MODAL_STATE'
export const SET_NEW_CONSOLE_MODAL = 'SET_NEW_CONSOLE_MODAL'

export const CONSOLE_OPENED = 'OPENED'
export const CONSOLE_IN_USE = 'IN_USE'
export const CONSOLE_LOGON = 'LOGON'

export const RDP_ID = 'rdp'
// console protocols
export const VNC = 'vnc'
export const SPICE = 'spice'
export const RDP = 'rdp'

// VNC modes sent from the backend (config property ClientModeVncDefault)
export const NO_VNC = 'NoVnc'
export const NATIVE = 'Native'

// UI console types (for spice and rdp protocol name is used directly)
export const BROWSER_VNC = 'BrowserVnc'
export const NATIVE_VNC = 'NativeVnc'
