import fs from 'fs'
import path from 'path'
import { sync as mkdirpSync } from 'mkdirp'
import chalk from 'chalk'

function normalizeMessages (messages) {
  return Object.keys(messages)
    .map(key => {
      const value = messages[key]
      return toReactIntlMessageDescriptor(key, value)
    })
}

function toReactIntlMessageDescriptor (messageId, messageValue) {
  if (typeof messageValue === 'string' || messageValue instanceof String) {
    return {
      id: messageId,
      defaultMessage: messageValue,
    }
  }
  if ('message' in messageValue) {
    const messageDescriptor = {
      id: messageId,
      defaultMessage: messageValue.message,
    }
    if ('description' in messageValue) {
      messageDescriptor.description = messageValue.description
    }
    return messageDescriptor
  }
}

function extractMessages (messages, destDir, destFile) {
  console.log(chalk.green(`> [extract-messages.js] write file -> ${destFile} ✔️`))
  const json2poMessages = normalizeMessages(messages)
  mkdirpSync(destDir)
  fs.writeFileSync(destFile, JSON.stringify(json2poMessages, null, 4))
  console.log()
}

extractMessages(
  require('../../src/intl/messages').messages,
  path.join('extra', 'to-zanata'),
  path.join('extra', 'to-zanata', 'messages.json')
)

extractMessages(
  require('../../src/intl/time-durations').timeDurations,
  path.join('extra', 'to-zanata'),
  path.join('extra', 'to-zanata', 'time-durations.json')
)
