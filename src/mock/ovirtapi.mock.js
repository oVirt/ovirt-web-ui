import $ from 'jquery'

import { logDebug } from '../helpers'
import { Exception } from '../exceptions'
import Selectors from '../selectors'
import AppConfiguration from '../config'
import { vms, disks, api } from './data.mock'
import MainApi from '../ovirtapi'

let OvirtApi = {}
OvirtApi = {
  // ----
  /**
   * @param vm - Single entry from oVirt REST /api/vms
   * @returns {} - Internal representation of a VM
   */
  vmToInternal: MainApi.vmToInternal,
  /**
   *
   * @param attachment - single entry from vms/[VM_ID]/diskattachments
   * @param disk - disk corresponding to the attachment
   * @returns {} - Internal representation of a single VM disk
   */
  diskToInternal: MainApi.diskToInternal,
  iconToInternal: MainApi.iconToInternal,
  consolesToInternal: MainApi.consolesToInternal,
  // ----
  login ({ credentials }) {
    
    return Promise.resolve({
      'access_token': '123456789',
      'scope': 'ovirt-app-api ovirt-ext=token-info:authz-search ovirt-ext=token-info:public-authz-search ovirt-ext=token-info:validate',
      'exp': '1493207433000',
      'token_type': 'bearer'
    })
  },
  getOvirtApiMeta () {
    return Promise.resolve(api)
  },
  getVm ({ vmId }) {
    for (let i in vms.vm) {
      if (vms.vm[i].id === vmId) {
        return Promise.resolve(vms.vm[i])
      }
    }
    return Promise.reject('')
  },
  getVmsByCount ({ count }) {
    return Promise.resolve(vms.slice(0, count))
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
    for (let i in vms.vm) {
      if (vms.vm[i].id === vmId) {
        return Promise.resolve(vms.vm[i].diskattachments)
      }
    }
    return Promise.reject('')
  },
  disk ({ diskId }) {
    for (let i in disks.disk) {
      if (disks.disk[i].id === diskId) {
        return Promise.resolve(disks.disk[i])
      }
    }
    return Promise.reject('')
  },
  consoles ({ vmId }) {
    for (let i in vms.vm) {
      if (vms.vm[i].id === vmId) {
        return Promise.resolve({ graphics_console: vms.vm[i].graphics_console })
      }
    }
    return Promise.reject('')
  },
  console ({ vmId, consoleId }) {
    for (let i in vms.vm) {
      if (vms.vm[i].id === vmId) {
        for (let j in vms.vm[i].graphics_console) {
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
