/* eslint-env jest */

import translatedMessages from './translated-messages.json'
import { localeDataMap, enumMsg } from './index'

describe('intl', () => {
  it('should import all necessary local data', () => {
    [...Object.keys(translatedMessages), 'en']
      .forEach(availableLocale => expect(Object.keys(localeDataMap)).toContain(availableLocale))
  })

  it('should survive unknown enum item', () => {
    const unknownEnumItem = 'unknownEnumItem'
    expect(enumMsg('UnknownEnum', unknownEnumItem)).toEqual(unknownEnumItem)
  })
})
