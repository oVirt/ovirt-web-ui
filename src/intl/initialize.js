// @flow

import moment from 'moment'
import 'moment/locale/cs'
import 'moment/locale/de'
import 'moment/locale/es'
import 'moment/locale/fr'
import 'moment/locale/it'
import 'moment/locale/ja'
import 'moment/locale/ko'
import 'moment/locale/pt-br'
import 'moment/locale/zh-cn'
import 'moment-duration-format'

import { BASE_LOCALE_SET, DEFAULT_LOCALE } from './index'
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

/**
 * Take a locale string and find the most specific version of the locale that
 * is supported by the App.
 *
 * For example:
 *    'en-US' -> 'en'
 *    'fr-CA' -> 'fr'
 *    'pt-PT' -> null  (since we support pt-BR and don't have a base pt translation)
 */
export function coerceToSupportedLocale (locale: ?string): ?string {
  if (!locale) {
    return null
  }

  if (/^en/.test(locale)) {
    return 'en'
  }

  if (BASE_LOCALE_SET.has(locale)) {
    return locale
  }

  const languageOnlyLocale = locale.split(/[-_]/)[0]
  return BASE_LOCALE_SET.has(languageOnlyLocale) ? languageOnlyLocale : null
}

//
// moment and moment-duration-format setup
//
export function initMomentTranslations (locale: string, defaultLocale: string) {
  const chosen = moment.locale([ locale, defaultLocale ])
  console.log(`Locale being used by moment: ${chosen}`)

  //
  // Extend the moment locale object for moment-duration-format:
  //   https://github.com/jsmreese/moment-duration-format#extending-moments-locale-object
  //
  const translations = require('./translated-time-durations.json')
  if (translations[locale]) {
    const t:{ [messageId: string]: string } = translations[locale]

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
