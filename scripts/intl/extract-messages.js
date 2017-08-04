  // @flow

import fs from 'fs'
import path from 'path'

import {sync as mkdirpSync} from 'mkdirp'
import chalk from 'chalk'

import {messages} from '../../src/intl/messages';

const OUTPUT_DIR = path.join('extra', 'to-zanata')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'messages.json')

function normalizeMessages(messages) {
  return Object.keys(messages)
    .map(key => {
      const value = messages[key]
      return toReactIntlMessageDescriptor(key, value)
    })
}

function toReactIntlMessageDescriptor(messageId, messageValue) {
  if (typeof messageValue === 'string' || messageValue instanceof String) {
    return {
      id: messageId,
      defaultMessage: messageValue
    }
  }
  if ('message' in messageValue) {
    const messageDescriptor: Object = {
      id: messageId,
      defaultMessage: messageValue.message
    }
    if ('description' in messageValue) {
      messageDescriptor.description = messageValue.description
    }
    return messageDescriptor
  }
}

function main() {
  const reactIntlMessages = normalizeMessages(messages)
  mkdirpSync(OUTPUT_DIR)
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(reactIntlMessages, null, 4))
  console.log(chalk.green(`[extract-messages.js] ${OUTPUT_FILE} written ✔️`))
}

main()
