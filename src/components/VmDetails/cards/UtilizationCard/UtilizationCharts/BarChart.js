import React from 'react'
import PropTypes from 'prop-types'
import { withMsg } from '_/intl'

import { ChartBar, Chart, ChartAxis, ChartTooltip, ChartStack, ChartLabel } from '@patternfly/react-charts'

const CustomLabel = ({ label, offsetX, text, ...rest }) => {
  const t = label ? typeof label === 'function' ? label(rest.datum) : label : ''
  return (
    <g>
      <ChartLabel {...rest} x={offsetX} dy={40} style={{ fontSize: 20 }} text={t} />
      <ChartTooltip
        {...rest}
        text={text}
        style={{ fontSize: 18 }}
        orientation='top'
        dx={-5}
        dy={-20}
        // See https://github.com/patternfly/patternfly-react/issues/7923
        flyoutWidth={350}
      />
    </g>
  )
}

CustomLabel.defaultEvents = ChartTooltip.defaultEvents
CustomLabel.propTypes = {
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  offsetX: PropTypes.number,
}

const BarChart = ({ data, additionalLabel, thresholdWarning, thresholdError, id, msg }) => {
  const availableInPercent = data.map(({ x, y }) => ({ x, y: 100 - y }))
  const offsetX = 0

  return (
    <div id={id}>
      <Chart domainPadding={{ x: 20 }} padding={{ left: offsetX, bottom: 40 }} height={100 * data.length}>
        <ChartStack horizontal colorScale={['rgb(0, 102, 204)', 'rgb(237, 237, 237)']}>
          <ChartBar barWidth={40} domain={{ y: [0, 100] }}
            style={{
              data: {
                fill: ({ datum }) => thresholdError && datum.y >= thresholdError
                  ? '#cc0000'
                  : thresholdWarning && datum.y >= thresholdWarning
                    ? '#ec7a08'
                    : '#3f9c35',
              },
            }}
            labelComponent={<CustomLabel offsetX={offsetX} label={additionalLabel} />}
            data={data}
            labels={({ datum }) => msg.utilizationCardLegendUsedWithDetails({ value: datum.y, diskPath: datum.x }) }
          />
          <ChartBar barWidth={40} domain={{ y: [0, 100] }}
            labelComponent={(
              <ChartTooltip
                style={{ fontSize: 18 }}
                orientation='top'
                dx={-5}
                dy={-20}
                // See https://github.com/patternfly/patternfly-react/issues/7923
                flyoutWidth={350}
              />
            )}
            style={{ parent: { border: '0px' } }}
            data={availableInPercent}
            labels={({ datum }) => msg.utilizationCardLegendAvailableWithDetails({ value: datum.y, diskPath: datum.x }) }
          />
        </ChartStack>
        <ChartAxis
          style={{
            axis: { strokeWidth: 0 },
            tickLabels: { fontSize: 22 },
          }}
          offsetX={offsetX}
        />
      </Chart>
    </div>
  )
}

BarChart.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array.isRequired,
  thresholdWarning: PropTypes.number,
  thresholdError: PropTypes.number,
  additionalLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  msg: PropTypes.object.isRequired,
}

export default withMsg(BarChart)
