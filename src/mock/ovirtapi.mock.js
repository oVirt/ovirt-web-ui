/* eslint-disable prefer-promise-reject-errors */
import AppConfiguration from '../config'
import { vms, disks, api } from './data.mock'

let OvirtApi = {}
OvirtApi = {
  // ----
  login ({ credentials }) {
    return Promise.resolve({
      access_token: '123456789',
      scope: 'ovirt-app-api ovirt-ext=token-info:authz-search ovirt-ext=token-info:public-authz-search ovirt-ext=token-info:validate',
      exp: '1493207433000',
      token_type: 'bearer',
    })
  },
  getOvirtApiMeta () {
    return Promise.resolve(api)
  },
  getVm ({ vmId }) {
    for (const i in vms.vm) {
      if (vms.vm[i].id === vmId) {
        return Promise.resolve(vms.vm[i])
      }
    }
    return Promise.reject('')
  },
  shutdown ({ vmId, force }) {
    OvirtApi._assertLogin({ methodName: 'shutdown' })
    const action = '<action />'
    let restMethod = 'shutdown'
    if (force) {
      restMethod = 'stop'
    }
    return OvirtApi._httpPost({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/${restMethod}`, input: action })
  },
  start ({ vmId }) {
    OvirtApi._assertLogin({ methodName: 'start' })
    return OvirtApi._httpPost({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/start`, input: '<action />' })
  },
  suspend ({ vmId }) {
    OvirtApi._assertLogin({ methodName: 'suspend' })
    return OvirtApi._httpPost({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/suspend`, input: '<action />' })
  },
  restart ({ vmId }) { // 'force' is not exposed by oVirt API
    OvirtApi._assertLogin({ methodName: 'restart' })
    return OvirtApi._httpPost({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/reboot`, input: '<action />' })
  },
  icon ({ id }) {
    OvirtApi._assertLogin({ methodName: 'icon' })
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/icons/${id}` })
  },
  diskattachments ({ vmId }) {
    for (const i in vms.vm) {
      if (vms.vm[i].id === vmId) {
        return Promise.resolve(vms.vm[i].diskattachments)
      }
    }
    return Promise.reject('')
  },
  disk ({ diskId }) {
    for (const i in disks.disk) {
      if (disks.disk[i].id === diskId) {
        return Promise.resolve(disks.disk[i])
      }
    }
    return Promise.reject('')
  },
  consoles ({ vmId }) {
    for (const i in vms.vm) {
      if (vms.vm[i].id === vmId) {
        return Promise.resolve({ graphics_console: vms.vm[i].graphics_console })
      }
    }
    return Promise.reject('')
  },
  console ({ vmId, consoleId }) {
    for (const i in vms.vm) {
      if (vms.vm[i].id === vmId) {
        for (const j in vms.vm[i].graphics_console) {
          if (vms.vm[i].graphics_console[j].id === consoleId) {
            return Promise.resolve({ graphics_console: vms.vm[i].graphics_console })
          }
        }
      }
    }
    return OvirtApi._httpGet({ url: `${AppConfiguration.applicationContext}/api/vms/${vmId}/graphicsconsoles/${consoleId}`, custHeaders: { Accept: 'application/x-virt-viewer' } })
  },
}

const Api = OvirtApi
export default Api
export * as Transforms from '../ovirtapi/transform'
