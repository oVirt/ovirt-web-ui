import $ from 'jquery'

import { setLogDebug, getURLQueryParameterByName } from './helpers'

const CONFIG_URL = '/ovirt-engine/web-ui/ovirt-web-ui.config'

const AppConfiguration = {
  debug: true,
  applicationContext: '',
  applicationURL: '',

  queryParams: { // from URL
    locale: null,
  },
}

function parseQueryParams () {
  AppConfiguration.queryParams.locale = getURLQueryParameterByName('locale')
}

export function readConfiguration () {
  parseQueryParams()

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
