import $ from 'jquery'

const CONFIG_URL = '/userportal.config'

const AppConfiguration = {}

export function readConfiguration () {
  $.ajax({
    url: CONFIG_URL,
    success: (result) => {
      Object.assign(AppConfiguration, JSON.parse(result))
    },
    error: (result) => {
      console.log(`Failed to load configuration: ${JSON.stringify(result)}`)
    },
    async: false,
  })
}

export default AppConfiguration
