import $ from 'jquery'

import { getURLQueryParameterByName } from 'app-helpers'
import { setLogDebug } from './logger'

const CONFIG_URL = '/ovirt-engine/web-ui/ovirt-web-ui.config'

const AppConfiguration = {
  debug: true,
  applicationContext: '',
  applicationURL: '/',
  pageLimit: 8,
  schedulerFixedDelayInSeconds: 60,

  consoleClientResourcesURL: 'https://www.ovirt.org/documentation/admin-guide/virt/console-client-resources/',
  cockpitPort: '9090',

  queryParams: { // from URL
    locale: null,
  },
}

export function readConfiguration () {
  parseQueryParams()

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

function parseQueryParams () {
  // TODO: align this with intl/index.js:getLocaleFromUrl()
  AppConfiguration.queryParams.locale = getURLQueryParameterByName('locale')
  console.log('parseQueryParams, provided locale: ', AppConfiguration.queryParams.locale)
}

export default AppConfiguration
