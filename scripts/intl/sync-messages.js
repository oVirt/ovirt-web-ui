// @flow

import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import stableStringify from 'json-stable-stringify-without-jsonify'

import { messages as englishMessages } from '../../src/intl/messages'

const TRANSLATED_MESSAGES = path.join('src', 'intl', 'translated-messages.json')

function main() {
  const stringContent = fs.readFileSync(TRANSLATED_MESSAGES, { encoding: 'utf8' })
  const parsedContent = JSON.parse(stringContent)
  removeNotExistedMessages(parsedContent)
  const serializedContent = stableStringify(parsedContent, { space: 2 }) + '\n'
  fs.writeFileSync(TRANSLATED_MESSAGES, serializedContent)
  console.log(chalk.green(`[sync-messages.js] ${TRANSLATED_MESSAGES} written ✔`))
}

/**
 * It may happen that some message will be deleted or renamed
 * in original (English) messages script and this function should
 * remove all translated messages that doesn't exist in original
 * file.
 *
 * @param translations object
 */
function removeNotExistedMessages(translations) {
  Object.keys(translations).forEach(langKey => {
    const languageMessages = translations[langKey]
    console.log(chalk.green(`[sync-messages.js] Checking language '${langKey}'`))
    Object.keys(languageMessages).forEach(messageKey => {
      if (!englishMessages[messageKey]) {
        console.log(chalk.yellow(`[sync-messages.js] Message '${messageKey}' will be removed`))
        delete languageMessages[messageKey]
      }
    })
  })
}

main()
