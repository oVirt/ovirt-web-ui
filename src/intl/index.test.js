/* eslint-env jest */
import { enumMsg, BASE_LOCALE_SET, DEFAULT_LOCALE, msg } from './index'
import localeWithFullName from './localeWithFullName.json'

describe('intl', () => {
  it('enumMsg should survive unknown enum item', () => {
    const unknownEnumItem = 'unknownEnumItem'
    expect(enumMsg('UnknownEnum', unknownEnumItem, msg)).toEqual(unknownEnumItem)
  })

  it('default locale exists in supported locales', () => {
    expect(BASE_LOCALE_SET.has(DEFAULT_LOCALE)).toBeTruthy()
  })

  it('each translated locale (full name) should exist in the supported locales', () => {
    Object.keys(localeWithFullName).forEach(id =>
      expect(BASE_LOCALE_SET.has(id)).toBeTruthy())
  })

  it('each supported locale should be translated', () => {
    BASE_LOCALE_SET.forEach(id => expect(localeWithFullName[id]).toBeTruthy())
  })
})
