// @flow

import moment from 'moment'
import 'moment/locale/cs'
import 'moment/locale/de'
import 'moment/locale/es'
import 'moment/locale/fr'
import 'moment/locale/it'
import 'moment/locale/ja'
import 'moment/locale/ko'
import 'moment/locale/ka'
import 'moment/locale/pt-br'
import 'moment/locale/zh-cn'
import 'moment-duration-format'

import baseLocaleWithFullName from './localeWithFullName.json'

import { DEFAULT_LOCALE } from './index'
import { timeDurations } from './time-durations'

export function discoverUserLocale (): string {
  return coerceToSupportedLocale(getLocaleFromUrl() || getBrowserLocale()) || DEFAULT_LOCALE
}

export function getLocaleFromUrl (): ?string {
  const localeMatch = /locale=(\w{2}([-_]\w{2})?)/.exec(window.location.search)
  if (localeMatch === null) {
    return null
  }
  const locale = localeMatch[1]
  return coerceToSupportedLocale(locale)
}

function getBrowserLocale (): ?string {
  if (window.navigator.language) {
    const locale = window.navigator.language
    if (locale) {
      return locale
    }
  }
  if (window.navigator.languages) {
    window.navigator.languages.forEach(browserLocale => {
      const locale = browserLocale
      if (locale) {
        return locale
      }
    })
  }
  return null
}

/**
 * Take a locale string and clean it up to match the base locale set.
 *
 * For example:
 *    'en' -> 'en-US'
 *    'en_US' -> 'en-US'
 *    'pt-PT' -> 'pt-BR' Because 'pt-PT' is not in the base locale set but we offer some sort of Portuguese so we return 'pt-BR'
 */
export function coerceToSupportedLocale (locale: ?string): ?string {
  const BASE_LOCALE_SET: Set<string> = new Set(Object.keys(baseLocaleWithFullName))
  if (!locale) {
    return null
  }

  let commonLocale = locale.replace('_', '-')
  const localeArray = commonLocale.split(/[-]/)
  if (localeArray.length === 2) {
    commonLocale = localeArray[0] + '-' + localeArray[1].toUpperCase()
  }
  if (BASE_LOCALE_SET.has(commonLocale)) {
    return commonLocale
  }

  for (const locale of BASE_LOCALE_SET) {
    if (locale.startsWith(localeArray[0])) {
      return locale
    }
  }

  return null
}

//
// moment and moment-duration-format setup
//
export function initMomentTranslations (locale: string, defaultLocale: string) {
  //
  // Extend the moment locale object for moment-duration-format:
  //   https://github.com/jsmreese/moment-duration-format#extending-moments-locale-object
  //
  const translations = require(`./locales/${locale}.json`)
  if (translations) {
    const t: { [messageId: string]: string } = translations

    // for built-in translations moment.js uses lower case identifiers
    // i.e. pt-br instead of pt-BR
    moment.updateLocale(locale.toLowerCase(), {
      durationLabelsStandard: {
        S: t.durationLabelStandard_S || timeDurations.durationLabelStandard_S.message,
        SS: t.durationLabelStandard_SS || timeDurations.durationLabelStandard_SS.message,
        s: t.durationLabelStandard_s || timeDurations.durationLabelStandard_s.message,
        ss: t.durationLabelStandard_ss || timeDurations.durationLabelStandard_ss.message,
        m: t.durationLabelStandard_m || timeDurations.durationLabelStandard_m.message,
        mm: t.durationLabelStandard_mm || timeDurations.durationLabelStandard_mm.message,
        h: t.durationLabelStandard_h || timeDurations.durationLabelStandard_h.message,
        hh: t.durationLabelStandard_hh || timeDurations.durationLabelStandard_hh.message,
        d: t.durationLabelStandard_d || timeDurations.durationLabelStandard_d.message,
        dd: t.durationLabelStandard_dd || timeDurations.durationLabelStandard_dd.message,
        w: t.durationLabelStandard_w || timeDurations.durationLabelStandard_w.message,
        ww: t.durationLabelStandard_ww || timeDurations.durationLabelStandard_ww.message,
        M: t.durationLabelStandard_M || timeDurations.durationLabelStandard_M.message,
        MM: t.durationLabelStandard_MM || timeDurations.durationLabelStandard_MM.message,
        y: t.durationLabelStandard_y || timeDurations.durationLabelStandard_y.message,
        yy: t.durationLabelStandard_yy || timeDurations.durationLabelStandard_yy.message,
      },

      durationLabelsShort: {
        S: t.durationLabelShort_S || timeDurations.durationLabelShort_S.message,
        SS: t.durationLabelShort_SS || timeDurations.durationLabelShort_SS.message,
        s: t.durationLabelShort_s || timeDurations.durationLabelShort_s.message,
        ss: t.durationLabelShort_ss || timeDurations.durationLabelShort_ss.message,
        m: t.durationLabelShort_m || timeDurations.durationLabelShort_m.message,
        mm: t.durationLabelShort_mm || timeDurations.durationLabelShort_mm.message,
        h: t.durationLabelShort_h || timeDurations.durationLabelShort_h.message,
        hh: t.durationLabelShort_hh || timeDurations.durationLabelShort_hh.message,
        d: t.durationLabelShort_d || timeDurations.durationLabelShort_d.message,
        dd: t.durationLabelShort_dd || timeDurations.durationLabelShort_dd.message,
        w: t.durationLabelShort_w || timeDurations.durationLabelShort_w.message,
        ww: t.durationLabelShort_ww || timeDurations.durationLabelShort_ww.message,
        M: t.durationLabelShort_M || timeDurations.durationLabelShort_M.message,
        MM: t.durationLabelShort_MM || timeDurations.durationLabelShort_MM.message,
        y: t.durationLabelShort_y || timeDurations.durationLabelShort_y.message,
        yy: t.durationLabelShort_yy || timeDurations.durationLabelShort_yy.message,
      },
    })
  }
}
