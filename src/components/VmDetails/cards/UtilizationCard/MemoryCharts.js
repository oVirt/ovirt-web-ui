import React from 'react'
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
  DonutChart,
  SparklineChart,
} from 'patternfly-react'

import { round, floor } from '_/utils'
import { donutMemoryTooltipContents } from '_/components/utils'
import { userFormatOfBytes } from '_/helpers'

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
  const available = isRunning ? memoryStats.free.datum : memoryStats.installed.datum
  const used = !isRunning ? 0 : memoryStats.installed.datum - memoryStats.free.datum

  const usedFormated = userFormatOfBytes(used, null, 1)
  const availableFormated = userFormatOfBytes(available, null, 1)
  const totalFormated = userFormatOfBytes(memoryStats.installed.datum, null, 1)

  // NOTE: Memory history comes sorted from newest to oldest
  const history = ((memoryStats['usage.history'] && memoryStats['usage.history'].datum) || []).reverse()

  const availableMemoryPercision = availableFormated.number >= 10
    ? availableFormated.number >= 100 ? 0 : 1
    : 2

  return (
    <UtilizationCard className={style['chart-card']} id={id}>
      <CardTitle>Memory</CardTitle>
      <CardBody>
        { !isRunning && <NoLiveData id={`${id}-no-live-data`} /> }
        { isRunning &&
        <React.Fragment>
          <UtilizationCardDetails>
            <UtilizationCardDetailsCount id={`${id}-available`}>
              {floor(availableFormated.number, availableMemoryPercision)}  {availableFormated.suffix !== totalFormated.suffix && availableFormated.suffix}
            </UtilizationCardDetailsCount>
            <UtilizationCardDetailsDesc>
              <UtilizationCardDetailsLine1>Available</UtilizationCardDetailsLine1>
              <UtilizationCardDetailsLine2 id={`${id}-total`}>of {round(totalFormated.number, 0)} {totalFormated.suffix}</UtilizationCardDetailsLine2>
            </UtilizationCardDetailsDesc>
          </UtilizationCardDetails>

          <DonutChart
            id={`${id}-donut-chart`}
            data={{
              columns: [
                [`Used`, used],
                [`Available`, available],
              ],
              order: null,
            }}
            title={{
              primary: `${usedFormated.rounded}`,
              secondary: `${usedFormated.suffix} Used`,
            }}
            tooltip={{
              show: true,
              contents: donutMemoryTooltipContents,
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
