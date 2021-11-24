import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardBody,
} from '@patternfly/react-core'
import DonutChart from './UtilizationCharts/DonutChart'
import AreaChart from './UtilizationCharts/AreaChart'

import { MsgContext } from '_/intl'

import style from './style.css'

import NoHistoricData from './NoHistoricData'
import NoLiveData from './NoLiveData'
import UtilizationCardData from './UtilizationCardData'

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
    <Card className={style['chart-card']} id={id}>
      <CardBody>
        {msg.utilizationCardTitleCpu()}
        { !isRunning && <NoLiveData id={`${id}-no-live-data`} /> }
        { isRunning && (
          <>
            <UtilizationCardData
              available={`${cpuAvailable}%`}
              line1={msg.utilizationCardAvailable()}
              line2={msg.utilizationCardOf100()}
              idPrefix={id}
            />

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
            { history.length > 0 && (
              <AreaChart
                id={`${id}-history-chart`}
                data={history.map((item, i) => ({ x: i, y: item }))}
                labels={({ datum }) => `${datum.y}%`}
              />
            )}
          </>
        )}
      </CardBody>
    </Card>
  )
}
CpuCharts.propTypes = {
  id: PropTypes.string.isRequired,
  cpuStats: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
  vcpus: PropTypes.number.isRequired,
}

export default CpuCharts
