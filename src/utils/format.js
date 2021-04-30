// @flow
import moment from 'moment'
import 'moment-duration-format'

const TWO_MINUTES = 2 * 60 * 1000

export function formatUptimeDuration (
  {
    interval,
    start,
    end,
  }: {
    interval?: number,
    start?: number,
    end?: number
  },
  defaultValue: ?string = undefined
): ?string {
  let durationInMS: number

  if (interval) {
    durationInMS = interval
  } else if (start && end) {
    durationInMS = end - start
  } else if (start && end === undefined) {
    durationInMS = Date.now() - start
  } else {
    return defaultValue
  }

  const formatted: string = moment.duration(durationInMS).format(
    durationInMS < TWO_MINUTES
      ? 'd __, h __, m __, s __'
      : 'd __, h __, m __'
  )
  return formatted
}

export function formatHowLongAgo (pastDate: Date, now: Date = new Date()): string {
  // 'now' parameter allows reliable testing
  // uses standard moment.relativeTimeThreshold values
  return moment.duration(moment(pastDate).diff(moment(now))).humanize(true)
}
