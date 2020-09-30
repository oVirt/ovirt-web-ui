/* eslint-env jest */

import translatedMessages from './translated-messages.json'
import { BASE_LOCALE_SET, enumMsg } from './index'

describe('intl', () => {
  it('index.js imports locale data for all locales with a translation', () => {
    [...Object.keys(translatedMessages), 'en']
      .forEach(
        availableLocale => expect(BASE_LOCALE_SET).toContain(availableLocale)
      )
  })

  it('enumMsg should survive unknown enum item', () => {
    const unknownEnumItem = 'unknownEnumItem'
    expect(enumMsg('UnknownEnum', unknownEnumItem)).toEqual(unknownEnumItem)
  })
})
