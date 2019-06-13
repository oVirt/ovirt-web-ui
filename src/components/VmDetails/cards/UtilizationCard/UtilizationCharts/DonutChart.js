import React from 'react'
import PropTypes from 'prop-types'
import { ChartDonut } from '@patternfly/react-charts'

const DonutChart = ({ data, title, subTitle }) => {
  return (
    <ChartDonut
      width={400}
      height={400}
      radius={100}
      innerRadius={85}
      colorScale={['rgb(0, 102, 204)', 'rgb(237, 237, 237)']}
      data={data}
      labels={datum => datum.label}
      subTitle={subTitle}
      title={title}
    />
  )
}

const datumPropType = PropTypes.shape({
  x: PropTypes.string,
  y: PropTypes.number,
  label: PropTypes.string,
})

DonutChart.propTypes = {
  data: PropTypes.arrayOf(datumPropType).isRequired,
  title: PropTypes.string.isRequired,
  subTitle: PropTypes.string.isRequired,
}

export default DonutChart
