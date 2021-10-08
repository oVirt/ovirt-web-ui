import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import stableStringify from 'json-stable-stringify-without-jsonify'

/**
 * Sometimes Zanata returns empty string. These are removed for the app to be able to
 * rendered the message in default language (English).
 *
 * @param translations object from zanata
 */
function removeEmptyMessages (translations) {
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

function normalize (source, destination) {
  console.log(chalk.green(`> [normalize-messages.js] write file -> ${destination} ✔`))
  const stringContent = fs.readFileSync(source, { encoding: 'utf8' })
  const parsedContent = JSON.parse(stringContent)
  removeEmptyMessages(parsedContent)

  const pretty = stableStringify(parsedContent, {
    space: '  ',
    cmp: (a, b) => { return a.key > b.key ? 1 : -1 },
  }) + '\n'

  fs.writeFileSync(destination, pretty)
  console.log()
}

normalize(
  path.join('extra', 'from-zanata', 'translated-messages.json'),
  path.join('src', 'intl', 'translated-messages.json')
)

normalize(
  path.join('extra', 'from-zanata', 'translated-time-durations.json'),
  path.join('src', 'intl', 'translated-time-durations.json')
)
