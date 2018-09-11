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

/**
 * Render current CPU % utilization as a donut chart and historic % utilization values
 * as a sparkline. Sparkline vales to go from oldest far left to most current on far
 * right.
 */
const CpuCharts = ({ cpuStats, isRunning }) => {
  const cpuUsed = cpuStats['current.guest'].datum
  const cpuAvailable = 100 - cpuUsed

  // NOTE: CPU history comes sorted from newest to oldest
  const history = ((cpuStats['usage.history'] && cpuStats['usage.history'].datum) || []).reverse()

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
  cpuStats: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
}

export default CpuCharts
