import $ from 'jquery'
import {logDebug} from './helpers'

let Api = {}

// For offline testing only
let testVms = [
  {
    id: 'id-1',
    name: 'Vm-1',
    state: 'running',
    startTime: '2015-03-01 02:00 AM',
    guestOperatingSystem: 'Linux'
  },
  {
    id: 'id-2',
    name: 'Vm-2',
    state: 'down',
    guestOperatingSystem: 'Linux'
  },
  {
    id: 'id-3',
    name: 'Vm-3',
    state: 'down',
    guestOperatingSystem: 'Linux'
  },
  {
    id: 'id-4',
    name: 'Vm-4',
    state: 'running',
    startTime: '2015-03-01 02:00 AM',
    guestOperatingSystem: 'Linux'
  },
  {
    id: 'id-5',
    name: 'Vm-5',
    state: 'running',
    startTime: '2015-03-01 02:00 AM',
    guestOperatingSystem: 'Linux'
  },
  {
    id: 'id-6',
    name: 'Vm-6',
    state: 'running',
    startTime: '2015-03-01 02:00 AM',
    guestOperatingSystem: 'Linux'
  },
  {
    id: 'id-7',
    name: 'Vm-7',
    state: 'running',
    startTime: '2015-03-01 02:00 AM',
    guestOperatingSystem: 'Linux'
  }
]

// ----------------------------------------------------------
const OvirtApi = {
  init ({store}) {
    this.store = store // for connection details
  },
  // ----
  _getLoginToken () { // redux store selector
    Api._assertStore({methodName: '_getLoginToken'})
    return Api.store.getState().config['loginToken']
  },
  _assertStore ({methodName}) {
    if (!this.store) {
      throw new Error(`OvirtApi in '${methodName}' uninitialized - missing store`)
    }
  },
  _assertLogin ({methodName}) {
    if (!Api._getLoginToken()) {
      throw new Error(`OvirtApi in '${methodName}': missing login`)
    }
  },
  _getAllVms() { // Fake data for testing only ...
    return Promise.resolve(testVms) // [] | testVms
  },

  // ----
  login (credentials) {
    const url = '/sso/oauth/token?grant_type=urn:ovirt:params:oauth:grant-type:http&scope=ovirt-app-api'
    const user = credentials.username
    const pwd = credentials.password

    return $.ajax(url, {
      type: "GET",
      headers: {
        'Accept': 'application/json',
        'Authorization': "Basic " + new Buffer(`${user}:${pwd}`, 'utf8').toString('base64')
      }
    }).then(data => Promise.resolve(data))
      .catch(data => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  getAllVms () {
    Api._assertLogin({methodName: 'getAllVms'})
    const url = '/api/vms'
    return $.ajax(url, {
      type: "GET",
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${Api._getLoginToken()['access_token']}`
      }
    }).then(data => Promise.resolve(data)).catch(data => console.log(`Ajax failed: ${JSON.stringify(data)}`));
  }
}

Api = OvirtApi
export default Api