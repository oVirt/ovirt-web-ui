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

import { convertValueMap, round } from 'utils'

import style from './style.css'

import NoHistoricData from './NoHistoricData'
import NoLiveData from './NoLiveData'

/**
 * Render current Memory use (free vs available) as a donut chart and historic use values
 * as a sparkline. Sparkline vales to go from oldest far left to most current on far
 * right.
 *
 * NOTE: If the guest agent is installed in the VM, additional (more accurate?) data
 *       will be available. In future, it may be nice to show the extra detail. The
 *       currently used data should work for VMs with and without the guest agent.
 */
const MemoryCharts = ({ memoryStats, isRunning, id }) => {
  const { unit, value } =
    convertValueMap(
      'B',
      {
        available: isRunning ? memoryStats.free.datum : memoryStats.installed.datum,
        total: memoryStats.installed.datum,
        used: !isRunning ? 0 : memoryStats.installed.datum - memoryStats.free.datum,
      })
  const memory = round(value, 0)

  // NOTE: Memory history comes sorted from newest to oldest
  const history = ((memoryStats['usage.history'] && memoryStats['usage.history'].datum) || []).reverse()

  return (
    <UtilizationCard className={style['chart-card']} id={id}>
      <CardTitle>Memory</CardTitle>
      <CardBody>
        { !isRunning && <NoLiveData id={`${id}-no-live-data`} /> }
        { isRunning &&
        <React.Fragment>
          <UtilizationCardDetails>
            <UtilizationCardDetailsCount id={`${id}-available`}>{round(memory.available, 0)}</UtilizationCardDetailsCount>
            <UtilizationCardDetailsDesc>
              <UtilizationCardDetailsLine1>Available</UtilizationCardDetailsLine1>
              <UtilizationCardDetailsLine2 id={`${id}-total`}>of {round(memory.total, 0)} {unit}</UtilizationCardDetailsLine2>
            </UtilizationCardDetailsDesc>
          </UtilizationCardDetails>

          <DonutChart
            id={`${id}-donut-chart`}
            data={{
              columns: [
                [`${unit} Used`, memory.used],
                [`${unit} Available`, memory.available],
              ],
              order: null,
            }}
            title={{
              primary: `${round(memory.used, 0)}`,
              secondary: `${unit} Used`,
            }}
            tooltip={{
              show: true,
              contents: patternfly.pfDonutTooltipContents,
            }}
          />

          { history.length === 0 && <NoHistoricData /> }
          { history.length > 0 &&
            <SparklineChart
              id={`${id}-line-chart`}
              data={{
                columns: [
                  ['%', ...history],
                ],
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
MemoryCharts.propTypes = {
  id: PropTypes.string.isRequired,
  memoryStats: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
}

export default MemoryCharts
