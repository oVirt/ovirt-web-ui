// @flow

import IntlMessageFormat from 'intl-messageformat'
import {
  coerceToSupportedLocale,
  discoverUserLocale,
  getLocaleFromUrl,
  initMomentTranslations,
} from './initialize'

import { messages, type MessageIdType, type MessageType } from './messages'
import baseLocaleWithFullName from './localeWithFullName.json'

export { withMsg, default as MsgContext } from './MsgContext'

export const DEFAULT_LOCALE: string = 'en-US'

export const localeWithFullName: {[string]: string} = baseLocaleWithFullName
export const BASE_LOCALE_SET: Set<string> = new Set(Object.keys(localeWithFullName))

/**
 * Currently selected locale
 */
export const locale: string = discoverUserLocale()
export const localeFromUrl: ?string = getLocaleFromUrl()

function getMessage (id: MessageIdType, targetLocale: string): string {
  const message = getMessageForLocale(id, targetLocale)
  if (message) {
    return message
  }
  if (targetLocale !== DEFAULT_LOCALE) {
    const enMessage = getMessageForLocale(id, DEFAULT_LOCALE)
    if (enMessage) {
      return enMessage
    }
  }
  return id
}

function loadLocalMessages (currentLocale: string): ?Set<string> {
  let translations = {}
  try {
    translations = require(`../intl/locales/${currentLocale}.json`)
  } catch (error) {
    console.log(error)
    // Fallback to default locale if it seems the locale can't be imported
    translations = require(`../intl/locales/${DEFAULT_LOCALE}.json`)
  }
  return translations
}

function getMessageForLocale (id: MessageIdType, targetLocale: string): ?string {
  const messages = loadLocalMessages(targetLocale)
  const message = messages[id]
  if (message) {
    return message
  }
  console.warn(`Message for id '${id}' and locale '${targetLocale}' not found.`)
  return null
}

const messageFormatCache: {[MessageIdType]: typeof IntlMessageFormat} = {}

function formatMessage (id: MessageIdType, values: ?Object, targetLocale: string): string {
  let messageFormat = messageFormatCache[id]
  if (!messageFormat) {
    messageFormat = new IntlMessageFormat(getMessage(id, targetLocale), targetLocale, {}, { ignoreTag: true })
    messageFormatCache[id] = messageFormat
  }
  return messageFormat.format(values)
}

function createFormattingFunctionsMap (targetLocale: string, messages: { [MessageIdType]: MessageType }): {[MessageIdType]: ((?Object) => string)} {
  return Object.keys(messages)
    .reduce((sum, key) => Object.assign(sum, { [key]: (values) => formatMessage(key, values, targetLocale) }), {})
}

export function createMessages (targetLocale: string): {[MessageIdType]: ((?Object) => string)} {
  const safeLocale = coerceToSupportedLocale(targetLocale) || DEFAULT_LOCALE
  for (const key in messageFormatCache) {
    delete messageFormatCache[key]
  }
  initMomentTranslations(safeLocale, DEFAULT_LOCALE)
  return createFormattingFunctionsMap(safeLocale, messages)
}

/**
 * Programmatically exported messages
 *
 * Keys corresponds to {@link messages}
 */
export const msg: {[MessageIdType]: ((?Object) => string)} = createMessages(locale)

/**
 * Utility function to translate enums
 */
export function enumMsg (enumId: string, enumItem: string, msg: {[MessageIdType]: ((?Object) => string)}): string {
  const messageKey: MessageIdType = (`enum_${enumId}_${enumItem}`: any)
  const messageFormattingFunction = msg && msg[messageKey]
  if (messageFormattingFunction) {
    return messageFormattingFunction()
  }
  console.warn(`No translation for enum item "${enumId}.${enumItem}" found.`)
  return enumItem
}
