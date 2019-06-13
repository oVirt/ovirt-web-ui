import React from 'react'
import PropTypes from 'prop-types'

import { ChartBar, Chart, ChartAxis, ChartTooltip, ChartStack, ChartLabel } from '@patternfly/react-charts'

const CustomLabel = ({ label, text, ...rest }) => {
  const t = label ? typeof label === 'function' ? label(rest.datum) : label : ''
  return (
    <g>
      <ChartLabel {...rest} x={50} dy={40} text={t} />
      <ChartTooltip {...rest} text={text} style={{ fontSize: 18 }} />
    </g>
  )
}

CustomLabel.defaultEvents = ChartTooltip.defaultEvents
CustomLabel.propTypes = {
  text: PropTypes.oneOfType([ PropTypes.string, PropTypes.func ]),
  label: PropTypes.oneOfType([ PropTypes.string, PropTypes.func ]),
}

const BarChart = ({ data, additionalLabel, thresholdWarning, thresholdError, ...rest }) => {
  const availableInPercent = data.map((datum) => ({ x: datum.x, y: 100 - datum.y }))
  console.log(availableInPercent)
  return <Chart domainPadding={{ x: 20 }}>
    <ChartStack horizontal colorScale={['rgb(0, 102, 204)', 'rgb(237, 237, 237)']}>
      <ChartBar barWidth={40} domain={{ y: [0, 100] }}
        style={{
          data: {
            fill: (d) => thresholdError && d.y >= thresholdError
              ? '#cc0000'
              : thresholdWarning && d.y >= thresholdWarning
                ? '#ec7a08'
                : '#3f9c35',
          },
        }}
        labelComponent={<CustomLabel label={additionalLabel} />}
        data={data}
        {...rest} />
      <ChartBar barWidth={40} domain={{ y: [0, 100] }}
        labelComponent={<ChartTooltip style={{ fontSize: 18 }} />}
        style={{ parent: { border: '0px' } }}
        data={availableInPercent}
        {...rest} />
    </ChartStack>
    <ChartAxis
      style={{
        axis: { strokeWidth: 0 },
      }}
    />
  </Chart>
}

BarChart.propTypes = {
  data: PropTypes.array.isRequired,
  thresholdWarning: PropTypes.number,
  thresholdError: PropTypes.number,
  additionalLabel: PropTypes.oneOfType([ PropTypes.string, PropTypes.func ]),
}

export default BarChart
