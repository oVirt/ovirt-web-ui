// @flow
import { patternfly } from 'patternfly-react'
import { userFormatOfBytes } from '_/helpers'
import { round } from '_/utils'

export function donutMemoryTooltipContents (
  d: Array<Object>,
  defaultTitleFormat: Function,
  defaultValueFormat: Function,
  color: Function
): string {
  const formated = userFormatOfBytes(d[0].value)
  const d2 = [Object.assign({}, d[0])]
  d2[0].value = round(formated.number, 1)
  d2[0].name = `${formated.suffix} ${d[0].name}`
  return patternfly.pfDonutTooltipContents(d2, defaultTitleFormat, defaultValueFormat, color)
}
