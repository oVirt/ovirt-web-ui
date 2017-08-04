// @flow

import IntlMessageFormat from 'intl-messageformat'
import { addLocaleData } from 'react-intl'
import enLocalData from 'react-intl/locale-data/en'
import deLocalData from 'react-intl/locale-data/de'
import frLocalData from 'react-intl/locale-data/fr'
import esLocalData from 'react-intl/locale-data/es'
import koLocalData from 'react-intl/locale-data/ko'
import itLocalData from 'react-intl/locale-data/it'
import jaLocalData from 'react-intl/locale-data/ja'
import ptLocalData from 'react-intl/locale-data/pt'
import ruLocalData from 'react-intl/locale-data/ru'
import zhLocalData from 'react-intl/locale-data/zh'

import { messages } from './messages'
import type { MessageIdType } from './messages'
// expected translations ['de', 'fr', 'es', 'ko', 'it', 'ja', 'pt-BR', 'ru', 'zh-CN']
import translatedMessages from './translated-messages.json'

/**
 * Currently selected locale
 */
export const locale: string = getLocaleFromUrl() || getBrowserLocale() || 'en'

function getBrowserLocale (): ?string {
  if (window.navigator.language) {
    const locale = coerceToSupportedLocale(window.navigator.language)
    if (locale) {
      return locale
    }
  }
  if (window.navigator.languages) {
    window.navigator.languages.forEach(browserLocale => {
      const locale = coerceToSupportedLocale(browserLocale)
      if (locale) {
        return locale
      }
    })
  }
  return null
}

function getLocaleFromUrl (): ?string {
  const localeMatch = /locale=([\w-]{2,})/.exec(window.location.search)
  if (localeMatch === null) {
    return null
  }
  const locale = localeMatch[1]
  return coerceToSupportedLocale(locale)
}

function coerceToSupportedLocale (locale: string): ?string {
  if (locale === 'en' || locale.startsWith('en-')) {
    return 'en'
  }
  if (getSupportedTranslatedLocales().has(locale)) {
    return locale
  }
  const languageOnlyLocale = getLocaleLanguage(locale)
  return getSupportedTranslatedLanguageOnlyLocales()[languageOnlyLocale] || null
}

function getSupportedTranslatedLocales (): Set<string> {
  return new Set(Object.keys(translatedMessages)).add('en')
}

/**
 * @return map langOnlyLocale => locale
 */
function getSupportedTranslatedLanguageOnlyLocales (): {[string]: string} {
  return Array.from(getSupportedTranslatedLocales())
    .reduce((sum, locale) => Object.assign(sum, { [getLocaleLanguage(locale)]: locale }), {})
}

function getLocaleLanguage (locale: string): string {
  return locale.split('-')[0]
}

export function getSelectedMessages (): { [MessageIdType]: string } {
  return translatedMessages[locale] || defaultMessages
}

function getMessage (id: MessageIdType): string {
  const message = getSelectedMessages()[id]
  if (message) {
    return message
  }
  console.warn(`Message for id '${id}' and locale '${locale}' not found.`)
  return id
}

const messageFormatCache: {[MessageIdType]: IntlMessageFormat} = {}

export function formatMessage (id: MessageIdType, values: ?Object): string {
  let messageFormat = messageFormatCache[id]
  if (!messageFormat) {
    messageFormat = new IntlMessageFormat(getMessage(id), locale)
    messageFormatCache[id] = messageFormat
  }
  return messageFormat.format(values)
}

type MessageType = string | {|
  message: string,
  description: string
|}

function removeMessageDescription (messages: { [MessageIdType]: MessageType }): { [MessageIdType]: string } {
  return Object.keys(messages)
    .map(key => {
      const value = (messages: any)[key]
      if (typeof value === 'object') {
        return [key, value.message]
      }
      return [key, value]
    })
    .reduce((sum, [key, value]) => Object.assign(sum, { [key]: value }), {})
}

const defaultMessages: { [MessageIdType]: string } = removeMessageDescription(messages)

function createIdsMap (messages: typeof messages): { [MessageIdType]: MessageIdType } {
  return Object.keys(messages)
    .reduce((sum, key) => Object.assign(sum, { [key]: key }), {})
}

/**
 * Identifies from {@link messages}
 *
 * To be used with react-intl <code>formatMessage</code>
 * and <code><FormattedMessage></code> component.
 *
 * @see https://github.com/yahoo/react-intl/wiki/API#formatmessage
 * @see https://github.com/yahoo/react-intl/wiki/Components#formattedmessage
 */
export const id: {[MessageIdType]: MessageIdType} = createIdsMap(messages)

function createFormattingFunctionsMap (messages: typeof messages): {[MessageIdType]: ((?Object) => string)} {
  return Object.keys(messages)
    .reduce((sum, key) => Object.assign(sum, { [key]: (values) => formatMessage(key, values) }), {})
}

/**
 * Programmatically exported messages
 *
 * Keys corresponds to {@link messages}
 */
export const msg: {[MessageIdType]: ((?Object) => string)} = createFormattingFunctionsMap(messages)

/**
 * Exported for tests purposes only
 */
export const localeDataMap = {
  en: enLocalData,
  de: deLocalData,
  fr: frLocalData,
  es: esLocalData,
  ko: koLocalData,
  it: itLocalData,
  ja: jaLocalData,
  'pt-BR': ptLocalData,
  ru: ruLocalData,
  'zh-CN': zhLocalData,

}

function initializeReactIntl () {
  const selectedLocalData = localeDataMap[locale]
  if (!selectedLocalData) {
    console.warn(`No locale data found to initialize 'react-intl' library for locale '${locale}'.`)
    addLocaleData(...localeDataMap['en'])
    return
  }
  addLocaleData(...selectedLocalData)
}

initializeReactIntl()
