import AppConfiguration from '_/config'
import { defaultOperatingSystemIds } from '_/constants/operatingSystems'

function translateParams (params, msg) {
  if (!params) {
    return
  }

  return Object.fromEntries(
    Object.entries(params)
      .map(([name, value]) =>
        [name, value?.id ? translate({ ...value, msg }) : value]
      )
  )
}

export function translate ({ id, params, msg }) {
  if (!msg) {
    console.trace('Translation object not provided.')
    return
  }
  if (!msg[id]) {
    console.warn(`Unknown translation key: ${id}`)
    // display just the id as string if there is no translation
    return id
  }

  return msg[id](translateParams(params, msg))
}

export function buildMessageFromRecord ({ messageDescriptor: { id, params } = {}, message }, msg) {
  if (!id) {
    return message
  }
  if (id && !message) {
    return translate({ id, params, msg })
  }

  // format previously used by failedExternalAction
  return `${translate({ id, params, msg })}\n${message}`
}

export function normalizeNotificationType (theType) {
  theType = String(theType).toLowerCase()
  // PF4 statuses
  if (['default', 'warning', 'success', 'info', 'danger'].includes(theType)) {
    return theType
  }

  // 'error' (used in PF3) was replaced by 'danger'
  return theType === 'error' ? 'danger' : 'warning'
}

export function buildNotificationTitle ({ id, params } = {}, msg, type) {
  if (!id) {
    // no title provide - generate one based on type
    return mapNotificationTypeToTitle(msg, type)
  }
  return translate({ id, params, msg })
}

function mapNotificationTypeToTitle (msg, type) {
  switch (type) {
    case 'warning':
      return msg.warning()
    case 'danger':
      return msg.error()
    case 'success':
      return msg.success()
    case 'info':
    default:
      return msg.info()
  }
}

// "payload":{"message":"Not Found","messageDescriptor":{"id": "loginFailed"},"type":404,"action":{"type":"LOGIN","payload":{"credentials":{"username":"admin@internal","password":"admi"}}}}}
export function hidePassword ({ action, param }) {
  if (action) {
    const hidden = JSON.parse(JSON.stringify(action))
    if (action.payload) {
      if (action.payload.credentials && action.payload.credentials.password) {
        hidden.payload.credentials.password = '*****'
      }

      if (action.payload.action && action.payload.action.payload &&
        action.payload.action.payload.credentials && action.payload.action.payload.credentials.password) {
        hidden.payload.action.payload.credentials.password = '*****'
      }
    }
    return hidden
  }

  if (param) {
    if (param.password) {
      const hidden = JSON.parse(JSON.stringify(param))
      hidden.password = '*****'
      return hidden
    }
    return param
  }

  return action
}

export function formatTwoDigits (num) {
  return String('0' + num).slice(-2)
}

/**
 * Download given content as a file in the browser
 *
 * @param data Content of the file
 * @param fileName
 * @param mimeType
 * @returns {*}
 */
export function fileDownload ({ data, fileName = 'myFile.dat', mimeType = 'application/octet-stream' }) {
  if (data) {
    const a = document.createElement('a')

    if (navigator.msSaveBlob) { // IE10
      return navigator.msSaveBlob(new Blob([data], { type: mimeType }), fileName)
    } else if ('download' in a && navigator.userAgent.indexOf('Firefox') === -1) { // html5 A[download], but not FF
      a.href = `data:${mimeType},${encodeURIComponent(data)}`
      a.style = 'display: none'
      a.setAttribute('download', fileName)

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      return true
    } else { // do iframe dataURL download (old ch + FF):
      const myForm = document.createElement('form')
      // textarea elements used instead of input to avoid text size limit issues
      const textArea1 = document.createElement('textarea')
      const textArea2 = document.createElement('textarea')
      const textArea3 = document.createElement('textarea')
      const ifr = document.createElement('iframe')
      const targetName = 'FormPanel_webadmin_1'

      myForm.target = targetName
      myForm.method = 'post'
      myForm.action = `${AppConfiguration.applicationContext}/services/attachment/${fileName}`
      myForm.enctype = 'application/x-www-form-urlencoded'
      myForm.style = 'display: none;'

      textArea1.name = 'contenttype'
      textArea1.appendChild(document.createTextNode(`${mimeType};+charset=UTF-8`))
      myForm.appendChild(textArea1)

      textArea2.name = 'content'
      textArea2.appendChild(document.createTextNode(encodeURIComponent(data)))
      myForm.appendChild(textArea2)

      textArea3.name = 'encodingtype'
      textArea3.appendChild(document.createTextNode('plain'))
      myForm.appendChild(textArea3)

      document.body.appendChild(myForm)

      // we want to stay in the same page, after downloading the file
      ifr.name = targetName
      ifr.style = 'position:absolute;width:0;height:0;border:0'
      document.body.appendChild(ifr)

      myForm.submit()

      // Cleanup the download DOM elements after it has a chance to do the download
      setTimeout(() => {
        document.body.removeChild(myForm)
        document.body.removeChild(ifr)
      }, 1000)

      return true
    }
  }
}

export function generateUnique (prefix) {
  prefix = prefix || ''
  return prefix + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function isWindows (name) {
  return name.toLowerCase().indexOf('windows') > -1
}

export function templateNameRenderer (template) {
  const version = template.get('version')
  const versionName = version.get('name')
  const templateName = template.get('name')

  return versionName
    ? (`${templateName} (${versionName})`)
    : templateName
}

export function hrefWithoutHistory (handler) {
  return (e) => {
    e.preventDefault()
    handler(e)
  }
}

export function getURLQueryParameterByName (name) {
  const url = window.location.href
  name = name.replace(/[\[\]]/g, '\\$&') // eslint-disable-line no-useless-escape
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
  const results = regex.exec(url)

  if (!results) {
    return null
  }
  if (!results[2]) {
    return ''
  }

  const uriComponent = results[2].replace(/\+/g, ' ')
  return decodeURIComponent(uriComponent)
}

/**
 * Return bytes in human readable format.
 *
 * [ human readable string, divised number, suffix ]
 *
 * @param number in Bytes
 * @param suffix optional
 * @returns {*}
 */
export function userFormatOfBytes (number, suffix = 'B', precision = 0) {
  const buildRetVal = (number, suffix) => {
    const rounded = number.toFixed(1)
    return {
      str: `${rounded} ${suffix}`,
      rounded,
      number,
      suffix,
    }
  }
  number = number || 0
  const factor = 1024
  const suffixes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB']
  const suffixStart = suffix && suffixes.indexOf(suffix) > -1 ? suffixes.indexOf(suffix) : 0

  // figure it out
  let divisor = 1
  suffix = ''
  const minValue = 1 - Math.pow(10, -precision) || 1
  for (let i = suffixStart; i < suffixes.length; i++) {
    const quotient = number / divisor
    if ((quotient / factor) < minValue) {
      number = quotient
      suffix = suffixes[i]
      break
    }
    divisor *= factor
  }

  return buildRetVal(number, suffix)
}

export function localeCompare (a, b, locale) {
  if (!locale) {
    console.trace('Non-localized compare detected!')
  }
  // natural sort order thanks to "numeric" option
  // ["b", "a10", "a2", "1"] -> [ "1", "a2", "a10", "b" ]
  return a.localeCompare(b, locale, { numeric: true })
}

export function sortedBy (array, sortBy, locale) {
  return array.sort((a, b) => localeCompare(a[sortBy], b[sortBy], locale))
}

/**
 * Similar to lodash keyBy
 * @param {Array<T>} array
 * @param {(T) => K} keySelector
 * @return {{[K]: T}} map
 */
export function arrayToMap (array, keySelector) {
  return array.reduce((accum, item) => {
    const key = keySelector(item)
    accum[key] = item
    return accum
  }, {})
}

export function getFormatedDateTime (timestamp) {
  const t = new Date(timestamp)
  return {
    time: `${formatTwoDigits(t.getHours())}:${formatTwoDigits(t.getMinutes())}:${formatTwoDigits(t.getSeconds())}`,
    date: `${t.getDate()}/${t.getMonth()}/${t.getFullYear()}`,
  }
}

export function filterOsByArchitecture (operatingSystems, architecture) {
  return operatingSystems.filter(os => os.get('architecture') === architecture)
}
export function getClusterArchitecture (clusterId, clusters) {
  const cluster = clusters && clusters.get(clusterId)
  return cluster && cluster.get('architecture')
}

export function getDefaultOSByArchitecture (operatingSystems, architecture) {
  const clustersOs = filterOsByArchitecture(operatingSystems, architecture)
  return clustersOs.find(os => defaultOperatingSystemIds.includes(os.get('id')))
}

export function findOsByName (operatingSystems, name) {
  return operatingSystems.toList().find(os =>
    os.get('name') === name)
}

export function toJS (obj) {
  return (obj && obj.toJS && obj.toJS()) || obj
}

export const isTpmRequired = (operatingSystemId, operatingSystems) => {
  return operatingSystems.getIn([operatingSystemId, 'tpmSupport']) === 'required'
}

export const getTpmChange = (operatingSystemId, operatingSystems) => {
  const tpmSupport = operatingSystems.getIn([operatingSystemId, 'tpmSupport'])
  switch (tpmSupport) {
    case 'required':
      return true
    case 'unsupported':
      return false
    case 'supported':
    default:
      // no change
      return undefined
  }
}
