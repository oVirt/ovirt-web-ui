import React from 'react'
import PropTypes from 'prop-types'
import {
  ChartGroup,
  ChartVoronoiContainer,
  ChartTooltip,
  ChartArea,
} from '@patternfly/react-charts'

import style from '../style.css'

const AreaChart = ({ data, labels, id }) => {
  return (
    <div id={id} className={style['area-box']}>
      <ChartGroup
        height={120}
        width={450}
        padding={{ top: 60 }}
        containerComponent={(
          <ChartVoronoiContainer
            labels={labels}
            // See https://github.com/patternfly/patternfly-react/issues/7923
            labelComponent={<ChartTooltip style={{ fontSize: 16 }} flyoutWidth={55} />}
          />
        )}
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
