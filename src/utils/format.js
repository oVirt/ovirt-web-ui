// @flow
import moment from 'moment'
import 'moment-duration-format'

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

  const formatted: string = moment.duration(durationInMS).format('d [days], h:mm')
  return formatted
}
