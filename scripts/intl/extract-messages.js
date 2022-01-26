import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import mkdirp from 'mkdirp'

import messages from '../../src/intl/messages.js'
import timeDurations from '../../src/intl/time-durations.js'

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
  mkdirp.sync(destDir)
  fs.writeFileSync(destFile, JSON.stringify(json2poMessages, null, 4))
  console.log()
}

extractMessages(
  messages.messages,
  path.join('extra', 'to-zanata'),
  path.join('extra', 'to-zanata', 'messages.json')
)

extractMessages(
  timeDurations.timeDurations,
  path.join('extra', 'to-zanata'),
  path.join('extra', 'to-zanata', 'time-durations.json')
)
