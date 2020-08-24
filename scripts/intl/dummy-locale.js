import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import stableStringify from 'json-stable-stringify-without-jsonify'

const DUMMY_LOCALE = 'aa'

function insertDummyLocaleAndSave(messages, destination) {
  const dummyMessages = {}
  Object.keys(messages).forEach(key => {
    const message = messages[key].message ? messages[key].message : messages[key]
    dummyMessages[key] = `\u21d2 ${message} \u21d0`
  })

  const stringContent = fs.readFileSync(destination, { encoding: 'utf8' })
  const parsedContent = JSON.parse(stringContent)
  parsedContent[DUMMY_LOCALE] = dummyMessages
  const serializedContent = stableStringify(parsedContent, { space: 2 }) + '\n'
  fs.writeFileSync(destination, serializedContent)
  console.log(chalk.green(`[normalize-messages.js] dummy locale ${DUMMY_LOCALE} inserted to ${destination} ✔`))
}

insertDummyLocaleAndSave(
  require('../../src/intl/messages').messages,
  path.join('src', 'intl', 'translated-messages.json')
)

insertDummyLocaleAndSave(
  require('../../src/intl/time-durations').timeDurations,
  path.join('src', 'intl', 'translated-time-durations.json')
)
