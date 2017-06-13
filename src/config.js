import $ from 'jquery'

import { setLogDebug } from './helpers'

const CONFIG_URL = '/ovirt-engine/web-ui/ovirt-web-ui.config'

const AppConfiguration = {
  debug: true,
  applicationContext: '',
  applicationURL: '/',

  consoleClientResourcesURL: 'https://www.ovirt.org/documentation/admin-guide/virt/console-client-resources/',
}

export function readConfiguration () {
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
    },
    async: false,
  })
}

export default AppConfiguration
