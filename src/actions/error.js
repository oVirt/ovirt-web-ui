// @flow
import { FAILED_EXTERNAL_ACTION, LOGIN_FAILED } from '_/constants'
import type { FailedExternalActionInputType, FailedExternalActionType } from './types'

function customizeErrorMessage (message: string): string {
  const result = message.replace('Vm ', 'VM ')
  return result
}

export function extractErrorText (exception: Object): string {
  return (exception.responseJSON && (exception.responseJSON.detail || (exception.responseJSON.fault && exception.responseJSON.fault.detail)))
    ? (exception.responseJSON.detail || exception.responseJSON.fault.detail)
    : (exception.statusText || 'UNKNOWN')
}

export function failedExternalAction ({ message, messageDescriptor, exception, failedAction }: FailedExternalActionInputType): FailedExternalActionType {
  if (exception) {
    message = message || extractErrorText(exception)
    message = customizeErrorMessage(message)

    const type = exception['status'] ? exception['status'] : 'ERROR'

    return {
      type: FAILED_EXTERNAL_ACTION,
      payload: {
        message,
        messageDescriptor,
        type,
        failedAction,
      },
    }
  }

  return {
    type: FAILED_EXTERNAL_ACTION,
    payload: {
      messageDescriptor,
      message,
      failedAction,
    },
  }
}

export function loginFailed ({ errorCode, message }: Object): Object {
  return {
    type: LOGIN_FAILED,
    payload: {
      errorCode,
      message,
    },
  }
}
