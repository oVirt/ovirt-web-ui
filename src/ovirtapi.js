/**
 * Created by mlibra on 27.9.16.
 */
import $ from 'jquery'
import {logDebug} from './helpers'
import {Exception} from './exceptions'

let OvirtApi = {}

OvirtApi = {
  init ({store}) {
    this.store = store // for connection details
  },
  // ----
  _getLoginToken () { // redux store selector
    OvirtApi._assertStore({methodName: '_getLoginToken'})
    return OvirtApi.store.getState().config.get('loginToken')
  },
  _assertStore ({methodName}) {
    if (!this.store) {
      throw new Exception(`OvirtApi in '${methodName}' uninitialized - missing store. Call the Api.init() method`)
    }
  },
  _assertLogin ({methodName}) {
    if (!OvirtApi._getLoginToken()) {
      throw new Exception(`OvirtApi in '${methodName}': missing login`)
    }
  },
  _httpGet ({url}) {
    return $.ajax(url, {
      type: "GET",
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${OvirtApi._getLoginToken().get('access_token')}`
      }
    }).then(data => Promise.resolve(data))
      .catch(data => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },
  _httpPost ({url, input}) {
    return $.ajax(url, {
      type: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/xml',
        'Authorization': `Bearer ${OvirtApi._getLoginToken().get('access_token')}`
      },
      data: input
    }).then(data => Promise.resolve(data))
      .catch(data => {
        logDebug(`Ajax failed: ${JSON.stringify(data)}`)
        return Promise.reject(data)
      })
  },

  // ----
  login ({credentials}) {
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
    OvirtApi._assertLogin({methodName: 'getAllVms'})
    const url = '/api/vms'
    return OvirtApi._httpGet({url})
  },
  shutdown ({vmId}) {
    OvirtApi._assertLogin({methodName: 'shutdown'})
    return OvirtApi._httpPost({url: `/api/vms/${vmId}/shutdown`, input: '<action />'})
  },
  start ({vmId}) {
    OvirtApi._assertLogin({methodName: 'start'})
    return OvirtApi._httpPost({url: `/api/vms/${vmId}/start`, input: '<action />'})
  },
  restart ({vmId}) {
    OvirtApi._assertLogin({methodName: 'restart'})
    return OvirtApi._httpPost({url: `/api/vms/${vmId}/reboot`, input: '<action />'})
  },
  icon ({id}) {
    OvirtApi._assertLogin({methodName: 'icon'})
    return OvirtApi._httpGet({url: `/api/icons/${id}`})
  }
}

export default OvirtApi
