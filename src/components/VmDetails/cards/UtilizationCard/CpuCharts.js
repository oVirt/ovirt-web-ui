import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import {
  CardTitle,
  CardBody,
  UtilizationCard,
  UtilizationCardDetails,
  UtilizationCardDetailsCount,
  UtilizationCardDetailsDesc,
  UtilizationCardDetailsLine1,
  UtilizationCardDetailsLine2,
} from 'patternfly-react'
import DonutChart from './UtilizationCharts/DonutChart'
import AreaChart from './UtilizationCharts/AreaChart'

import { MsgContext } from '_/intl'

import style from './style.css'

import NoHistoricData from './NoHistoricData'
import NoLiveData from './NoLiveData'

/**
 * Render current CPU % utilization as a donut chart and historic % utilization values
 * as a sparkline. Sparkline vales to go from oldest far left to most current on far
 * right.
 */
const CpuCharts = ({ cpuStats, isRunning, id, vcpus }) => {
  const { msg } = useContext(MsgContext)
  const cpuUsed = cpuStats['current.total'].firstDatum / vcpus // the average value considering the number of VM CPUs, same as in Admin Portal
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
            data={[
              {
                x: msg.utilizationCardLegendUsedP(),
                y: cpuUsed,
                label: `${msg.utilizationCardLegendUsed()}: ${cpuUsed}%`,
              },
              {
                x: msg.utilizationCardLegendAvailableP(),
                y: cpuAvailable,
                label: `${msg.utilizationCardAvailable()}: ${cpuAvailable}%`,
              },
            ]}
            subTitle={msg.utilizationCardLegendUsedP()}
            title={`${cpuUsed}`}
          />

          { history.length === 0 && <NoHistoricData id={`${id}-no-historic-data`} /> }
          { history.length > 0 &&
            <AreaChart
              id={`${id}-history-chart`}
              data={history.map((item, i) => ({ x: i, y: item }))}
              labels={datum => `${datum.y}%`}
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
  vcpus: PropTypes.number.isRequired,
}

export default CpuCharts
