import $ from 'jquery'

import { setLogDebug } from '_/logger'
import { DEFAULT_ARCH } from '_/constants'
import { VNC, NATIVE } from '_/constants/console'

const CONFIG_URL = '/ovirt-engine/web-ui/ovirt-web-ui.config'

const AppConfiguration = {
  debug: true,
  applicationContext: '', // url where ovirt is available ('' is web server root)
  applicationURL: '/', // url where this app is available (dev server path or webapp context root)
  applicationLogoutURL: '', // url to invalidate the user's SSO token ('' skips SSO token invalidation)
  pageLimit: 20,
  schedulerFixedDelayInSeconds: 60,
  notificationSnoozeDurationInMinutes: 10,
  showNotificationsDefault: true,
  persistLocale: true,
  smartcardSpice: true,

  consoleClientResourcesURL: 'https://www.ovirt.org/documentation/admin-guide/virt/console-client-resources/',
  cockpitPort: '9090',
}

export const DefaultEngineOptions = Object.seal({
  MaxNumOfVmSockets: 16,
  MaxNumOfCpuPerSocket: 254,
  MaxNumOfThreadsPerCpu: 8,
  MaxNumOfVmCpusPerArch: `{${DEFAULT_ARCH}=1}`,

  SpiceUsbAutoShare: true,
  getUSBFilter: {},

  UserSessionTimeOutInterval: 30,

  DefaultGeneralTimeZone: 'Etc/GMT',
  DefaultWindowsTimeZone: 'GMT Standard Time',

  WebSocketProxy: null,
  ClientModeConsoleDefault: VNC,
  ClientModeVncDefault: NATIVE,
})

export function readConfiguration () {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: CONFIG_URL,
      success: (result) => {
        Object.assign(AppConfiguration, JSON.parse(result))
      },
      error: (result) => {
        console.log(`Failed to load production configuration, assuming development mode.`)
      },
      complete: () => {
        setLogDebug(AppConfiguration.debug)
        resolve()
      },
      async: true,
    })
  })
}

export default AppConfiguration
