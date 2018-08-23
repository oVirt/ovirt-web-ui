import React from 'react'
import PropTypes from 'prop-types'
import {
  patternfly,
  CardTitle,
  CardBody,
  UtilizationCard,
  UtilizationCardDetails,
  UtilizationCardDetailsCount,
  UtilizationCardDetailsDesc,
  UtilizationCardDetailsLine1,
  UtilizationCardDetailsLine2,
  DonutChart,
  SparklineChart,
} from 'patternfly-react'

import style from './style.css'

import NoHistoricData from './NoHistoricData'
import NoLiveData from './NoLiveData'

const CpuCharts = ({ stats, isRunning }) => {
  const cpuUsed = stats.cpu['current.guest'].datum
  const cpuAvailable = 100 - cpuUsed
  const history = (stats.cpu['usage.history'] && stats.cpu['usage.history'].datum) || [] // TODO: check the order of values is as expected

  return (
    <UtilizationCard className={style['chart-card']}>
      <CardTitle>CPU</CardTitle>
      <CardBody>
        { !isRunning && <NoLiveData /> }
        { isRunning &&
        <React.Fragment>
          <UtilizationCardDetails>
            <UtilizationCardDetailsCount>{cpuAvailable}%</UtilizationCardDetailsCount>
            <UtilizationCardDetailsDesc>
              <UtilizationCardDetailsLine1>Available</UtilizationCardDetailsLine1>
              <UtilizationCardDetailsLine2>of 100%</UtilizationCardDetailsLine2>
            </UtilizationCardDetailsDesc>
          </UtilizationCardDetails>

          <DonutChart
            id='donut-chart-cpu'
            data={{
              columns: [
                ['% Used', cpuUsed],
                ['% Available', cpuAvailable],
              ],
              order: null,
            }}
            title={{
              primary: `${cpuUsed}`, // NOTE: String else 0 is truthy false and doesn't render proper
              secondary: '% Used',
            }}
            tooltip={{
              show: true,
              contents: patternfly.pfDonutTooltipContents,
            }}
          />

          { history.length === 0 && <NoHistoricData /> }
          { history.length > 0 &&
            <SparklineChart
              id='line-chart-cpu'
              data={{
                columns: [['%', ...history]],
                type: 'area',
              }}
            />
          }
        </React.Fragment>
        }
      </CardBody>
    </UtilizationCard>
  )
}
CpuCharts.propTypes = {
  stats: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
}

export default CpuCharts
