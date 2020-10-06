// @flow

import IntlMessageFormat from 'intl-messageformat'
import { initIntl, getLocaleFromUrl } from './initialize'

import { messages, type MessageIdType, type MessageType } from './messages'
import translatedMessages from './translated-messages.json'
import localeWithFullName from './localeWithFullName.json'

export const DEFAULT_LOCALE: string = 'en'

export const DUMMY_LOCALE: string = 'aa' // NOTE: Used for development and testing

export const BASE_LOCALE_SET: Set<string> = new Set(Object.keys(localeWithFullName))
/**
 * Currently selected locale
 */
export const locale: string = initIntl()
export const localeFromUrl: ?string = getLocaleFromUrl()

function getMessage (id: MessageIdType): string {
  const message = getMessageForLocale(id, locale)
  if (message) {
    return message
  }
  if (locale !== DEFAULT_LOCALE) {
    const enMessage = getMessageForLocale(id, DEFAULT_LOCALE)
    if (enMessage) {
      return enMessage
    }
  }
  return id
}

function getMessageForLocale (id: MessageIdType, locale: string): ?string {
  const messages = locale === DEFAULT_LOCALE ? defaultMessages : translatedMessages[locale]
  const message = messages[id]
  if (message) {
    return message
  }
  console.warn(`Message for id '${id}' and locale '${locale}' not found.`)
  return null
}

const messageFormatCache: {[MessageIdType]: IntlMessageFormat} = {}

function formatMessage (id: MessageIdType, values: ?Object): string {
  let messageFormat = messageFormatCache[id]
  if (!messageFormat) {
    messageFormat = new IntlMessageFormat(getMessage(id), locale)
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

function createFormattingFunctionsMap (messages: { [MessageIdType]: MessageType }): {[MessageIdType]: ((?Object) => string)} {
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
 * Utility function to translate enums
 */
export function enumMsg (enumId: string, enumItem: string): string {
  const messageKey: MessageIdType = (`enum_${enumId}_${enumItem}`: any)
  const messageFormattingFunction = msg[messageKey]
  if (messageFormattingFunction) {
    return messageFormattingFunction()
  }
  console.warn(`No translation for enum item "${enumId}.${enumItem}" found.`)
  return enumItem
}
