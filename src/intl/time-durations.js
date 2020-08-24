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

export function setupMomentTranslations (locale: string, defaultLocale: string) {
  if (locale === 'aa') {
    moment.defineLocale('aa', {})
  }

  const chosen = moment.locale([ locale, defaultLocale ])
  console.log(`Locale being used by moment: ${chosen}`)

  //
  // Extend the moment locale object for moment-duration-format:
  //   https://github.com/jsmreese/moment-duration-format#extending-moments-locale-object
  //
  const translations = require('./translated-time-durations.json')
  if (translations[locale]) {
    const t:{ [messageId: string]: string } = translations[locale]

    moment.updateLocale(locale, {
      durationLabelsStandard: {
        S: t.durationLabelStandard_S || timeDurations.durationLabelStandard_S.message,
        SS: t.durationLabelStandard_SS || timeDurations.durationLabelStandard_SS.message,
        s: t.durationLabelStandard__s || timeDurations.durationLabelStandard_s.message,
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

export const timeDurations: { [messageId: string]: {| message: string, description: string |} } =
{
  durationLabelStandard_S: {
    message: 'millisecond',
    description: 'standard label for a single millisecond',
  },

  durationLabelStandard_SS: {
    message: 'milliseconds',
    description: 'standard label for multiple milliseconds',
  },

  durationLabelStandard_s: {
    message: 'second',
    description: 'standard label for a single second',
  },

  durationLabelStandard_ss: {
    message: 'seconds',
    description: 'standard label for multiple seconds',
  },

  durationLabelStandard_m: {
    message: 'minute',
    description: 'standard label for a single minute',
  },

  durationLabelStandard_mm: {
    message: 'minutes',
    description: 'standard label for multiple minutes',
  },

  durationLabelStandard_h: {
    message: 'hour',
    description: 'standard label for a single hour',
  },

  durationLabelStandard_hh: {
    message: 'hours',
    description: 'standard label for multiple hours',
  },

  durationLabelStandard_d: {
    message: 'day',
    description: 'standard label for a single day',
  },

  durationLabelStandard_dd: {
    message: 'days',
    description: 'standard label for multiple days',
  },

  durationLabelStandard_w: {
    message: 'week',
    description: 'standard label for a single week',
  },

  durationLabelStandard_ww: {
    message: 'weeks',
    description: 'standard label for multiple weeks',
  },

  durationLabelStandard_M: {
    message: 'month',
    description: 'standard label for a single month',
  },

  durationLabelStandard_MM: {
    message: 'months',
    description: 'standard label for multiple months',
  },

  durationLabelStandard_y: {
    message: 'year',
    description: 'standard label for a single year',
  },

  durationLabelStandard_yy: {
    message: 'years',
    description: 'standard label for multiple years',
  },

  durationLabelShort_S: {
    message: 'msec',
    description: 'short label for a single millisecond',
  },

  durationLabelShort_SS: {
    message: 'msecs',
    description: 'short label for multiple milliseconds',
  },

  durationLabelShort_s: {
    message: 'sec',
    description: 'short label for a single second',
  },

  durationLabelShort_ss: {
    message: 'secs',
    description: 'short label for multiple seconds',
  },

  durationLabelShort_m: {
    message: 'min',
    description: 'short label for a single minute',
  },

  durationLabelShort_mm: {
    message: 'mins',
    description: 'short label for multiple minutes',
  },

  durationLabelShort_h: {
    message: 'hr',
    description: 'short label for a single hour',
  },

  durationLabelShort_hh: {
    message: 'hrs',
    description: 'short label for multiple hours',
  },

  durationLabelShort_d: {
    message: 'dy',
    description: 'short label for a single day',
  },

  durationLabelShort_dd: {
    message: 'dys',
    description: 'short label for multiple days',
  },

  durationLabelShort_w: {
    message: 'wk',
    description: 'short label for a single week',
  },

  durationLabelShort_ww: {
    message: 'wks',
    description: 'short label for multiple weeks',
  },

  durationLabelShort_M: {
    message: 'mo',
    description: 'short label for a single month',
  },

  durationLabelShort_MM: {
    message: 'mos',
    description: 'short label for multiple months',
  },

  durationLabelShort_y: {
    message: 'yr',
    description: 'short label for a single year',
  },

  durationLabelShort_yy: {
    message: 'yrs',
    description: 'short label for multiple years',
  },
}
