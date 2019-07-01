import React from 'react'
import PropTypes from 'prop-types'
import { ChartDonut } from '@patternfly/react-charts'

const DonutChart = ({ data, title, subTitle, id }) => {
  return (
    <div id={id}>
      <ChartDonut
        width={400}
        height={250}
        radius={100}
        innerRadius={85}
        colorScale={['rgb(0, 136, 206)', 'rgb(209, 209, 209)']}
        data={data}
        labels={datum => datum.label}
        subTitle={subTitle}
        title={title}
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
