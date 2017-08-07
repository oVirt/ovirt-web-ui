/* eslint-env jest */

import translatedMessages from './translated-messages.json'
import { localeDataMap } from './index'

describe('intl', () => {
  it('should import all necessary local data', () => {
    [...Object.keys(translatedMessages), 'en']
      .forEach(availableLocale => expect(Object.keys(localeDataMap)).toContain(availableLocale))
  })
})
