import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import stableStringify from 'json-stable-stringify-without-jsonify'

import {messages} from '../../src/intl/messages'
const DESTINATION = path.join('src', 'intl', 'translated-messages.json')

const DUMMY_LOCALE = 'aa'

function main() {
  const justMessages = {}
  Object.keys(messages).forEach(key => {
    const message = messages[key].message ? messages[key].message : messages[key]
    justMessages[key] = `\u21d2 ${message} \u21d0`
  })

  const stringContent = fs.readFileSync(DESTINATION, { encoding: 'utf8' })
  const parsedContent = JSON.parse(stringContent)
  parsedContent[DUMMY_LOCALE] = justMessages
  const serializedContent = stableStringify(parsedContent, { space: 2 }) + '\n'
  fs.writeFileSync(DESTINATION, serializedContent)
  console.log(chalk.green(`dummy locale ${DUMMY_LOCALE} inserted to [normalize-messages.js] ${DESTINATION} ✔`))
}

main()
