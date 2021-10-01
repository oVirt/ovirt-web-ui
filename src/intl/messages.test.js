/* eslint-env jest */

import parser from '@formatjs/icu-messageformat-parser'
import { messages as englishMessages } from './messages'
import translatedMessages from './translated-messages.json'

/*
 * Take a set of messages and generate a normalized object that can be deep compared
 * to another to see if the message structures match.
 *
 * To support how messages are defined in `messages.js` and `translated-messages.json`,
 * the __messages__ argument should be an object with keys of the format:
 *
 *   1. stringId: 'English string'
 *   2. stringId: { message: 'English string', description: 'field description' }
 *
 * Regardless of input format, output will be normalized to look like:
 *   {
 *     '_id_': {
 *       msg: '',
 *       pattern: { type: 'argumentElement', id: ''argumentElement: '',  }
 *   }
 */
function normalizeMessagesForDiff (messages) {
  const normalForm = {}

  // normalize the key and message from any of the valid source formats
  Object.keys(messages).forEach(key => {
    if (messages[key].message) {
      normalForm[key] = { msg: messages[key].message }
    } else if (typeof messages[key] === 'string') {
      normalForm[key] = { msg: messages[key] }
    }
  })

  // extract the format arguments from the messages
  Object.keys(normalForm).forEach(name => {
    const parsed = normalForm[name].msg ? parser.parse(normalForm[name].msg) : { type: 'empty' }
    const args = normalForm[name].args = {}

    if (parsed.type === 'messageFormatPattern') {
      parsed.elements.forEach(element => {
        if (element.type === 'argumentElement') {
          args[element.id] = (element.format && element.format.type) || null
        }
      })
    }
  })

  return normalForm
}

describe('verify the content of each locale in translated-messages.json', () => {
  const englishNormalForm = normalizeMessagesForDiff(englishMessages)

  describe.each(Object.keys(translatedMessages))(
    'check locale [%s]',
    (locale) => {
      const localeNormalForm = normalizeMessagesForDiff(translatedMessages[locale])

      describe.each(Object.keys(localeNormalForm))(
        'verify message key [%s]',
        (key) => {
          test('localized key is a defined English key', () => {
            expect(englishNormalForm).toHaveProperty(key)
          })

          test('messages match ICU arguments', () => {
            expect(localeNormalForm[key].args).toEqual(englishNormalForm[key].args)
          })
        }
      )
    }
  )
})
