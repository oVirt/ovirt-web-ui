import { FAILED_EXTERNAL_ACTION } from '../constants'

export function failedExternalAction ({ message, shortMessage, exception, action }) {
  if (exception) {
    message = message || (
      (exception['responseJSON'] && (exception.responseJSON.detail || exception.responseJSON.fault && exception.responseJSON.fault.detail))
        ? (exception.responseJSON.detail || exception.responseJSON.fault.detail)
        : (exception['statusText'] || 'UNKNOWN')
      )
    const type = exception['status'] ? exception['status'] : 'ERROR'
    return {
      type: FAILED_EXTERNAL_ACTION,
      payload: {
        message,
        shortMessage,
        type,
        action,
      },
    }
  }

  return {
    type: FAILED_EXTERNAL_ACTION,
    payload: {
      message,
      action,
    },
  }
}

export function loginFailed ({ errorCode, message }) {
  return {
    type: 'LOGIN_FAILED',
    payload: {
      errorCode,
      message,
    },
  }
}
