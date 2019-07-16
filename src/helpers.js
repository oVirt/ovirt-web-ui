import { locale as appLocale, msg } from '_/intl'

const PPC_64 = 'ppc64'
const S390X = 's390x'

// "payload":{"message":"Not Found","shortMessage":"LOGIN failed","type":404,"action":{"type":"LOGIN","payload":{"credentials":{"username":"admin@internal","password":"admi"}}}}}
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
    if (param['password']) {
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
    } else if ('download' in a) { // html5 A[download]
      a.href = `data:${mimeType},${encodeURIComponent(data)}`
      a.setAttribute('download', fileName)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return true
    } else { // do iframe dataURL download (old ch+FF):
      const f = document.createElement('iframe')
      document.body.appendChild(f)
      f.src = `data:${mimeType},${encodeURIComponent(data)}`
      setTimeout(() => document.body.removeChild(f), 333)
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

export function localeCompare (a, b, locale = appLocale) {
  return a.localeCompare(b, locale, { numeric: true })
}

export function sortedBy (array, sortBy, locale = appLocale) {
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

export function formatDateFromNow (d) {
  const now = Date.now()
  const date = new Date(d)

  const suffixes = [ msg.secondsShort(), msg.minutesShort(), msg.hoursShort(), msg.daysShort(), msg.monthsShort(), msg.yearsShort() ]
  const divitions = [ 1000, 60, 60, 24, 30, 12 ]
  let elapsed = (now - date.getTime())
  let suffix = ''

  let currentIndex = 0
  do {
    suffix = suffixes[currentIndex]
    elapsed = Math.floor(elapsed / divitions[currentIndex])
    currentIndex++
  } while (divitions[currentIndex] <= elapsed && currentIndex < suffixes.length)

  return msg.timeAgo({ time: `${elapsed}${suffix}` })
}

export function filterOsByArchitecture (operatingSystems, architecture) {
  return operatingSystems.filter(os => {
    const osName = os.get('name')
    if (architecture === PPC_64 || architecture === S390X) {
      return osName.includes(architecture)
    } else {
      // default to x64_86 for others (x64_86, undefined - all architectures)
      return !osName.includes(PPC_64) && !osName.includes(S390X)
    }
  })
}

export function findOsByName (operatingSystems, name) {
  return operatingSystems.toList().find(os =>
    os.get('name') === name)
}
