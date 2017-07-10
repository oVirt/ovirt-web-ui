import { FAILED_EXTERNAL_ACTION } from '../constants/index'

function customizeErrorMessage (message) {
  const result = message.replace('Vm ', 'VM ')
  return result
}

export function failedExternalAction ({ message, shortMessage, exception, action }) {
  if (exception) {
    message = message || (
      (exception['responseJSON'] && (exception.responseJSON.detail || exception.responseJSON.fault && exception.responseJSON.fault.detail))
        ? (exception.responseJSON.detail || exception.responseJSON.fault.detail)
        : (exception['statusText'] || 'UNKNOWN')
      )
    message = shortMessage + '\n' + customizeErrorMessage(message)

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

