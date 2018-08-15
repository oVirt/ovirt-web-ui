let isDebugEnabled = true

export function setLogDebug (enabled) {
  isDebugEnabled = enabled
}

const noop = function () {}

/*
 * Functions bound to the real console object, in the correct context for generating
 * appropriate file/line numbers.  Also provide the first few arguments to the real
 * function calls to add pretty line prefixes.
 */
const consoleFunctions = {
  log: window.console.log.bind(window.console, '%c debug %c', 'font-weight: bold; background-color: #21409a; color: white;', ''),
  info: window.console.info.bind(window.console, '%c info %c', 'font-weight: bold; background-color: #01acac; color: white;', ''),
  warn: window.console.warn.bind(window.console, '%c warn %c', 'font-weight: bold; background-color: #f8a51b; color: white;', ''),
  error: window.console.error.bind(window.console, '%c error %c', 'font-weight: bold; background-color: #ed403c; color: white;', ''),
}

function attachLoggers (object) {
  return Object.defineProperties(window.console, {
    'log': { get () { return isDebugEnabled ? consoleFunctions.log : noop } },
    'info': { get () { return isDebugEnabled ? consoleFunctions.info : noop } },
    'warn': { get () { return isDebugEnabled ? consoleFunctions.warn : noop } },
    'error': { get () { return isDebugEnabled ? consoleFunctions.error : noop } },
  })
}

attachLoggers(window.console)

export default attachLoggers({})
