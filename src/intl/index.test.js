/* eslint-env jest */

import translatedMessages from './translated-messages.json'
import { localeDataMap, enumMsg } from './index'

describe('intl', () => {
  it('index.js imports locale data for all locales with a translation', () => {
    [...Object.keys(translatedMessages), 'en']
      .forEach(availableLocale => expect(Object.keys(localeDataMap)).toContain(availableLocale))
  })

  it('enumMsg should survive unknown enum item', () => {
    const unknownEnumItem = 'unknownEnumItem'
    expect(enumMsg('UnknownEnum', unknownEnumItem)).toEqual(unknownEnumItem)
  })
})
