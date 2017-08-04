// @flow

/**
 * Enter messages here.
 *
 * Please keep keys valid JavaScript identifiers.
 *
 * @type {Object.<string, (string | {message: string, description: string})>}
 */
export const messages = {
  start: 'Start',
  reboot: {
    message: 'Reboot',
    description: 'Toolbar button to reboot a VM',
  },
}

export type MessageIdType = $Keys<typeof messages>
