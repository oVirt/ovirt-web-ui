export function failedExternalAction ({ message, shortMessage, exception, action }) {
  if (exception) {
    message = message || ((exception['responseJSON'] && exception.responseJSON.fault && exception.responseJSON.fault.detail) ? (exception.responseJSON.fault.detail) : (exception['statusText'] || 'UNKNOWN'))
    const type = exception['status'] ? exception['status'] : 'ERROR'
    return {
      type: 'FAILED_EXTERNAL_ACTION',
      payload: {
        message,
        shortMessage,
        type,
        action,
      },
    }
  }

  return {
    type: 'FAILED_EXTERNAL_ACTION',
    payload: {
      message,
      action,
    },
  }
}
