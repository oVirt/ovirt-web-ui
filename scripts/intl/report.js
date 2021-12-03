import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { table } from 'table'
import { messages as englishMessages } from '../../src/intl/messages'

function round (number, precision = 0) {
  const factor = Math.pow(10, precision)
  const temp = number * factor
  const roundedTemp = Math.round(temp)
  return roundedTemp / factor
}

function reportDuplicateValues (englishMessages, translatedMessagesPerLocale) {
  const byValue = {}
  Object.keys(englishMessages).forEach(key => {
    const value = typeof englishMessages[key] === 'string' ? englishMessages[key] : englishMessages[key].message
    const byVal = byValue[value] || []
    byVal.push(key)
    byValue[value] = byVal
  })

  const multiples = {}
  Object.keys(byValue).forEach(value => {
    if (byValue[value].length > 1) {
      multiples[value] = byValue[value]
    }
  })
  console.log(chalk`Multiple value count: {yellow ${Object.keys(multiples).length}}`)

  const report = []
  Object.keys(byValue).forEach(value => {
    if (byValue[value].length > 1) {
      report.push([
        chalk`{blue ${value}}`,
        byValue[value].join('\n'),
        byValue[value]
          .map(key => {
            const localesWithKey = []
            Object.keys(translatedMessagesPerLocale).forEach(locale => {
              if (translatedMessagesPerLocale[locale][key]) {
                localesWithKey.push(chalk.magenta(locale))
              }
            })
            return chalk`{yellow ${localesWithKey.length}}: ${localesWithKey.join(', ')}`
          })
          .join('\n'),
        byValue[value]
          .map(key => {
            const localesWithKey = []
            Object.keys(translatedMessagesPerLocale).forEach(locale => {
              if (!translatedMessagesPerLocale[locale][key]) {
                localesWithKey.push(chalk.magenta(locale))
              }
            })
            return chalk`{yellow ${localesWithKey.length}}: ${localesWithKey.join(', ')}`
          })
          .join('\n'),

      ])
    }
  })

  if (report.length > 0) {
    console.log(table([['Text', 'Key', 'Locales With Key', 'Locales w/o Key'], ...report]))
  } else {
    console.log('No keys with duplicate values!')
  }
}

function reportUntranslatedKeys (englishMessages, translatedMessagesPerLocale) {
  const messagesKeyCount = Object.keys(englishMessages).length

  const untranslated = {}
  Object.keys(translatedMessagesPerLocale).forEach(locale => {
    untranslated[locale] = []
    const translated = translatedMessagesPerLocale[locale]
    Object.keys(englishMessages).forEach(key => {
      if (!translated[key]) {
        untranslated[locale].push(key)
      }
    })
  })

  const untranslatedReport = []
  Object.keys(untranslated)
    .filter(locale => untranslated[locale].length > 0)
    .forEach(locale => {
      const untranslatedPercent = round(untranslated[locale].length / messagesKeyCount * 100, 1)
      untranslatedReport.push([
        chalk.blue(locale),
        chalk.magenta(`${untranslatedPercent}%`),
        untranslatedPercent > 20.0
          ? chalk.red(`>20% of keys are untranslated [${untranslated[locale].length}/${messagesKeyCount}]`)
          : untranslated[locale].sort().join('\n'),
      ])
    })

  if (untranslatedReport.length === 0) {
    console.log(chalk`{green All keys for all locales are translated!}`)
  } else {
    console.log(table([['locale', '% untranslated', 'keys'], ...untranslatedReport]))
  }
}

function reportCoverage (englishMessages, translatedMessagesPerLocale) {
  const messagesKeyCount = Object.keys(englishMessages).length

  const report = []
  Object.keys(translatedMessagesPerLocale).forEach(
    locale => {
      const localKeyCount = Object.keys(translatedMessagesPerLocale[locale]).length
      const percent = round((localKeyCount / messagesKeyCount) * 100, 1)
      report.push([
        chalk.blue(locale),
        `${localKeyCount}/${messagesKeyCount}`,
        chalk.yellow(`${percent}%`),
      ])
    }
  )
  console.log(table([['locale', 'keys', 'percent'], ...report], {
    columns: {
      0: {},
      1: { alignment: 'right' },
      2: { alignment: 'right' },
    },
    drawHorizontalLine: (index, size) => index === 0 || index === 1 || index === size,
  }))
}

//
// Run the reports...
//
const TRANSLATED = path.join('src', 'intl', 'translated-messages.json')
const translatedMessagesPerLocale = JSON.parse(fs.readFileSync(TRANSLATED, 'utf8'))

console.log(chalk`English key count: {yellow ${Object.keys(englishMessages).length}}`)
console.log()
console.log('Untranslated keys per locale:')
reportUntranslatedKeys(englishMessages, translatedMessagesPerLocale)
console.log()
reportDuplicateValues(englishMessages, translatedMessagesPerLocale)
console.log()
console.log('Translation coverage report:')
reportCoverage(englishMessages, translatedMessagesPerLocale)
