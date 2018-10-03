let isDebugEnabled = true

export function setLogDebug (enabled) {
  isDebugEnabled = enabled
}

const NOOP = function () {}
const BASE_FUNCTIONS = {
  log: window.console.log,
  info: window.console.info,
  warn: window.console.warn,
  error: window.console.error,
}

/*
 * Functions bound to the real console object, in the correct context for generating
 * appropriate file/line numbers.  Also provide the first few arguments to the real
 * function calls to add pretty line prefixes.
 */
let consoleFunctions = {}

export function enhanceOutput (enhancers) {
  consoleFunctions = {
    log: BASE_FUNCTIONS.log.bind(window.console, ...enhancers.debug),
    info: BASE_FUNCTIONS.info.bind(window.console, ...enhancers.info),
    warn: BASE_FUNCTIONS.warn.bind(window.console, ...enhancers.warn),
    error: BASE_FUNCTIONS.error.bind(window.console, ...enhancers.error),
  }
}

enhanceOutput({
  debug: ['%c debug %c', 'font-weight: bold; background-color: #21409a; color: white;', ''],
  info: ['%c info %c', 'font-weight: bold; background-color: #01acac; color: white;', ''],
  warn: ['%c warn %c', 'font-weight: bold; background-color: #f8a51b; color: white;', ''],
  error: ['%c error %c', 'font-weight: bold; background-color: #ed403c; color: white;', ''],
})

/*
 * Setup accessor properties on the given object to capture the base console logging
 * functions and provide our own "enhanced" function instead. Use `setLogDebug` to
 * control if the function returned will do any actual logging.
 */
function attachLoggers (object) {
  return Object.defineProperties(object, {
    'log': { get () { return isDebugEnabled ? consoleFunctions.log : NOOP } },
    'info': { get () { return isDebugEnabled ? consoleFunctions.info : NOOP } },
    'warn': { get () { return isDebugEnabled ? consoleFunctions.warn : NOOP } },
    'error': { get () { return isDebugEnabled ? consoleFunctions.error : NOOP } },
  })
}

attachLoggers(window.console)

export default attachLoggers({})
