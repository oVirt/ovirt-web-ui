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
 * Setup accessor properties on the given object to capture the base console logging
 * functions and use `setLogDebug` to control if the function returned will do any
 * actual logging.
 */
function attachLoggers (object) {
  return Object.defineProperties(object, {
    log: { get () { return isDebugEnabled ? BASE_FUNCTIONS.log : NOOP } },
    info: { get () { return isDebugEnabled ? BASE_FUNCTIONS.info : NOOP } },
    warn: { get () { return isDebugEnabled ? BASE_FUNCTIONS.warn : NOOP } },
    error: { get () { return isDebugEnabled ? BASE_FUNCTIONS.error : NOOP } },
  })
}

attachLoggers(window.console)

export default attachLoggers({})
