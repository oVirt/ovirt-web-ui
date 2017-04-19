export function updateVmDialogErrorMessage (message) { // TODO: handle via UserMessages
  return {
    type: 'UPDATE_VM_DIALOG_ERROR_MESSAGE',
    payload: {
      message,
    },
  }
}
