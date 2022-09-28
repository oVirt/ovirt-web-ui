import React from 'react'
import PropTypes from 'prop-types'
import {
  ChartDonut,
  ChartLabel,
  ChartTooltip,
} from '@patternfly/react-charts'

import style from '../style.css'

const DonutChart = ({ data, title, subTitle, id }) => {
  return (
    <div id={id} className={style['donut-container']}>
      <ChartDonut
        width={300}
        height={250}
        radius={100}
        innerRadius={85}
        donutDx={25}
        colorScale={['rgb(0, 136, 206)', 'rgb(209, 209, 209)']}
        data={data}
        labels={datum => datum.label}
        subTitle={subTitle}
        title={title}
        style={{ labels: { fontSize: 12 } }}
        titleComponent={<ChartLabel style={[{ fontSize: 30 }, { fontSize: 20, fill: '#bbb' }]} />}
        // See https://github.com/patternfly/patternfly-react/issues/7923
        labelComponent={<ChartTooltip flyoutWidth={180} />}
      />
    </div>
  )
}

const datumPropType = PropTypes.shape({
  x: PropTypes.string,
  y: PropTypes.number,
  label: PropTypes.string,
})

DonutChart.propTypes = {
  id: PropTypes.string,
  data: PropTypes.arrayOf(datumPropType).isRequired,
  title: PropTypes.string.isRequired,
  subTitle: PropTypes.string.isRequired,
}

export default DonutChart
