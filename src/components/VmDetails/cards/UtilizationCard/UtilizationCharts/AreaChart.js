import React from 'react'
import PropTypes from 'prop-types'
import {
  ChartGroup,
  ChartVoronoiContainer,
  ChartTooltip,
  ChartArea,
} from '@patternfly/react-charts'

const AreaChart = ({ data, labels, id }) => {
  return (
    <div id={id}>
      <ChartGroup
        height={150}
        width={450}
        containerComponent={
          <ChartVoronoiContainer
            labels={labels}
            labelComponent={<ChartTooltip style={{ fontSize: 16 }} />}
          />
        }
      >
        <ChartArea
          style={{ data: { fill: 'rgb(0, 136, 206)', strokeWidth: 5 } }}
          data={data}
        />
      </ChartGroup>
    </div>
  )
}

const datumPropType = PropTypes.shape({
  x: PropTypes.number,
  y: PropTypes.number,
  name: PropTypes.string,
})

AreaChart.propTypes = {
  id: PropTypes.string,
  data: PropTypes.arrayOf(datumPropType).isRequired,
  labels: PropTypes.func.isRequired,
}

export default AreaChart
