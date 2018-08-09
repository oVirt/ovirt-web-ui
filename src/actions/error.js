import { FAILED_EXTERNAL_ACTION, LOGIN_FAILED } from '../constants'

function customizeErrorMessage (message) {
  const result = message.replace('Vm ', 'VM ')
  return result
}

export function extractErrorText (exception) {
  return (exception.responseJSON && (exception.responseJSON.detail || (exception.responseJSON.fault && exception.responseJSON.fault.detail)))
    ? (exception.responseJSON.detail || exception.responseJSON.fault.detail)
    : (exception.statusText || 'UNKNOWN')
}

/*flow-include
export type FailedExternalActionInput = {
  message: string,
  shortMessage: string,
  exception?: Object,
  failedAction?: Object
}

export type FailedExternalAction = {
  type: 'FAILED_EXTERNAL_ACTION',
  payload: {
    message: string,
    failedAction?: Object,
  } | {
    message: string,
    shortMessage: string,
    type: number | 'ERROR',
    failedAction: Object
  }
}
*/
export function failedExternalAction ({ message, shortMessage, exception, failedAction } /*: FailedExternalActionInput */) /*: FailedExternalAction */ {
  if (exception) {
    message = message || extractErrorText(exception)
    message = shortMessage + '\n' + customizeErrorMessage(message)

    const type = exception['status'] ? exception['status'] : 'ERROR'

    return {
      type: FAILED_EXTERNAL_ACTION,
      payload: {
        message,
        shortMessage,
        type,
        failedAction,
      },
    }
  }

  return {
    type: FAILED_EXTERNAL_ACTION,
    payload: {
      message,
      failedAction,
    },
  }
}

export function loginFailed ({ errorCode, message }) {
  return {
    type: LOGIN_FAILED,
    payload: {
      errorCode,
      message,
    },
  }
}
