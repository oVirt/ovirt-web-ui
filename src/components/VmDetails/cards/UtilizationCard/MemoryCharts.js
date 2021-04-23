import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import {
  CardBody,
  CardTitle,
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
import { round, floor } from '_/utils'
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
  const { msg } = useContext(MsgContext)
  const available = isRunning ? memoryStats.free.firstDatum : memoryStats.installed.firstDatum
  const used = !isRunning ? 0 : memoryStats.installed.firstDatum - memoryStats.free.firstDatum

  const usedFormated = userFormatOfBytes(used, null, 1)
  const availableFormated = userFormatOfBytes(available, null, 1)
  const totalFormated = userFormatOfBytes(memoryStats.installed.firstDatum, null, 1)

  // NOTE: Memory history comes sorted from newest to oldest
  const history = ((memoryStats['usage.history'] && memoryStats['usage.history'].datum) || []).reverse()

  const availableMemoryPercision = availableFormated.number >= 10
    ? availableFormated.number >= 100 ? 0 : 1
    : 2

  return (
    <UtilizationCard className={style['chart-card']} id={id}>
      <CardTitle>{msg.utilizationCardTitleMemory()}</CardTitle>
      <CardBody>
        { !isRunning && <NoLiveData id={`${id}-no-live-data`} /> }
        { isRunning &&
        <React.Fragment>
          <UtilizationCardDetails>
            <UtilizationCardDetailsCount id={`${id}-available`}>
              {msg.utilizationCardUnitNumber({
                number: floor(availableFormated.number, availableMemoryPercision),
                storageUnits: availableFormated.suffix !== totalFormated.suffix && availableFormated.suffix,
              })}
            </UtilizationCardDetailsCount>
            <UtilizationCardDetailsDesc>
              <UtilizationCardDetailsLine1>{msg.utilizationCardAvailable()}</UtilizationCardDetailsLine1>
              <UtilizationCardDetailsLine2 id={`${id}-total`}>
                {msg.utilizationCardOf({
                  number: round(totalFormated.number, 0),
                  storageUnits: totalFormated.suffix,
                })}
              </UtilizationCardDetailsLine2>
            </UtilizationCardDetailsDesc>
          </UtilizationCardDetails>
          <DonutChart
            id={`${id}-donut-chart`}
            data={[
              {
                x: msg.utilizationCardLegendUsed(),
                y: used,
                label: `${msg.utilizationCardLegendUsed()}: ${usedFormated.rounded} ${usedFormated.suffix}`,
              },
              {
                x: msg.utilizationCardLegendAvailable(),
                y: available,
                label: `${msg.utilizationCardLegendAvailable()}: ${availableFormated.rounded} ${availableFormated.suffix}`,
              },
            ]}
            subTitle={msg.utilizationCardUnitUsed({ storageUnit: usedFormated.suffix })}
            title={`${usedFormated.rounded}`}
          />
          { history.length === 0 && <NoHistoricData id={`${id}-no-historic-data`} /> }
          { history.length > 0 &&
            <AreaChart
              id={`${id}-history-chart`}
              data={history.map((item, i) => ({ x: i + 1, y: item, name: 'memory' }))}
              labels={datum => `${datum.y}%`}
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
