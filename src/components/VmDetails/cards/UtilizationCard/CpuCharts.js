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
import { msg } from '_/intl'

import style from './style.css'

import NoHistoricData from './NoHistoricData'
import NoLiveData from './NoLiveData'

/**
 * Render current CPU % utilization as a donut chart and historic % utilization values
 * as a sparkline. Sparkline vales to go from oldest far left to most current on far
 * right.
 */
const CpuCharts = ({ cpuStats, isRunning, id }) => {
  const cpuUsed = cpuStats['current.guest'].datum
  const cpuAvailable = 100 - cpuUsed

  // NOTE: CPU history comes sorted from newest to oldest
  const history = ((cpuStats['usage.history'] && cpuStats['usage.history'].datum) || []).reverse()

  return (
    <UtilizationCard className={style['chart-card']} id={id}>
      <CardTitle>{msg.utilizationCardTitleCpu()}</CardTitle>
      <CardBody>
        { !isRunning && <NoLiveData id={`${id}-no-live-data`} /> }
        { isRunning &&
        <React.Fragment>
          <UtilizationCardDetails>
            <UtilizationCardDetailsCount id={`${id}-available`}>{cpuAvailable}%</UtilizationCardDetailsCount>
            <UtilizationCardDetailsDesc>
              <UtilizationCardDetailsLine1>{msg.utilizationCardAvailable()}</UtilizationCardDetailsLine1>
              <UtilizationCardDetailsLine2 id={`${id}-total`}>{msg.utilizationCardOf100()}</UtilizationCardDetailsLine2>
            </UtilizationCardDetailsDesc>
          </UtilizationCardDetails>

          <DonutChart
            id={`${id}-donut-chart`}
            data={{
              columns: [
                [msg.utilizationCardLegendUsedP(), cpuUsed],
                [msg.utilizationCardLegendAvailableP(), cpuAvailable],
              ],
              order: null,
            }}
            title={{
              primary: `${cpuUsed}`, // NOTE: String else 0 is truthy false and doesn't render proper
              secondary: msg.utilizationCardLegendUsedP(),
            }}
            tooltip={{
              show: true,
              contents: patternfly.pfDonutTooltipContents,
            }}
          />

          { history.length === 0 && <NoHistoricData id={`${id}-no-historic-data`} /> }
          { history.length > 0 &&
            <SparklineChart
              id={`${id}-line-chart`}
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
  id: PropTypes.string.isRequired,
  cpuStats: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
}

export default CpuCharts
