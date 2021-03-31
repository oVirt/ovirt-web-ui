// @flow

import IntlMessageFormat from 'intl-messageformat'
import { discoverUserLocale, getLocaleFromUrl, coerceToSupportedLocale, initMomentTranslations } from './initialize'

import { messages, type MessageIdType, type MessageType } from './messages'
import translatedMessages from './translated-messages.json'
import baseLocaleWithFullName from './localeWithFullName.json'
import moment from 'moment'

export { withMsg, default as MsgContext } from './MsgContext'

export const DEFAULT_LOCALE: string = 'en'

const DUMMY_LOCALE: string = 'aa' // NOTE: Used for development and testing

function buildBaseLocale (): {[string]: string} {
  if (!translatedMessages[DUMMY_LOCALE]) {
    return baseLocaleWithFullName
  }
  console.warn(`Enable test locale: ${DUMMY_LOCALE}`)
  moment.defineLocale(DUMMY_LOCALE, {})
  return {
    ...baseLocaleWithFullName,
    [DUMMY_LOCALE]: DUMMY_LOCALE,
  }
}

export const localeWithFullName = buildBaseLocale()
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

function getMessageForLocale (id: MessageIdType, targetLocale: string): ?string {
  const messages = targetLocale === DEFAULT_LOCALE ? defaultMessages : translatedMessages[targetLocale]
  const message = messages[id]
  if (message) {
    return message
  }
  console.warn(`Message for id '${id}' and locale '${targetLocale}' not found.`)
  return null
}

const messageFormatCache: {[MessageIdType]: IntlMessageFormat} = {}

function formatMessage (id: MessageIdType, values: ?Object, targetLocale: string): string {
  let messageFormat = messageFormatCache[id]
  if (!messageFormat) {
    messageFormat = new IntlMessageFormat(getMessage(id, targetLocale), targetLocale)
    messageFormatCache[id] = messageFormat
  }
  return messageFormat.format(values)
}

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

function createFormattingFunctionsMap (targetLocale: string, messages: { [MessageIdType]: MessageType }): {[MessageIdType]: ((?Object) => string)} {
  return Object.keys(messages)
    .reduce((sum, key) => Object.assign(sum, { [key]: (values) => formatMessage(key, values, targetLocale) }), {})
}

export function createMessages (targetLocale: string): {[MessageIdType]: ((?Object) => string)} {
  const safeLocale = coerceToSupportedLocale(targetLocale) || DEFAULT_LOCALE
  console.log(`Create messages for locale ${safeLocale}`)
  if (targetLocale !== safeLocale) {
    console.warn(`Locale ${targetLocale} is not supported and was replaced with ${safeLocale}`)
  }
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
