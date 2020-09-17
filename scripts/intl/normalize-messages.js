// @flow

import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import stableStringify from 'json-stable-stringify-without-jsonify'
import { table } from 'table'

import { messages as englishMessages } from '../../src/intl/messages'

const SOURCE = path.join('extra', 'from-zanata', 'translated-messages.json')
const DESTINATION = path.join('src', 'intl', 'translated-messages.json')

function main() {
  const stringContent = fs.readFileSync(SOURCE, { encoding: 'utf8' })
  const parsedContent = JSON.parse(stringContent)
  removeEmptyMessages(parsedContent)

  const pretty = stableStringify(parsedContent, {
    space: '  ',
    cmp: (a, b) => { return a.key > b.key ? 1 : -1 }
  }) + '\n'
  fs.writeFileSync(DESTINATION, pretty)
  console.log(chalk.green(`[normalize-messages.js] ${DESTINATION} written ✔`))
}

/**
 * Sometimes Zanata returns empty string. These are removed for the app to be able to
 * rendered the message in default language (English).
 *
 * @param translations object from zanata
 */
function removeEmptyMessages(translations) {
  Object.keys(translations).forEach(langKey => {
    const languageMessages = translations[langKey]
    Object.keys(languageMessages).forEach(messageKey => {
      const messageValue = languageMessages[messageKey]
      if (messageValue === '') {
        delete languageMessages[messageKey]
      }
    })
  })
}

main()
