import $ from 'jquery'

// For Development
// const CONFIG_URL = '/userportal.config'

// TODO: configure path automatically
// For Production
const CONFIG_URL = '/ovirt-engine/web-ui/userportal.config'

const AppConfiguration = {
  'applicationContext': '/ovirt-engine',
  'applicationURL': '/ovirt-engine/web-ui',
}

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
