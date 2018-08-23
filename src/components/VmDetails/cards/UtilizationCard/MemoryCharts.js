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

import { convertValueMap } from '../../../../utils/storage-conversion'
import { round } from '../../../../utils/round'

import style from './style.css'

import NoHistoricData from './NoHistoricData'
import NoLiveData from './NoLiveData'

/*
 * NOTE: If the guest agent is installed in the VM, additional (more accurate?) data
 *       will be available. In future, it may be nice to show the extra detail. The
 *       currently used data should work for VMs with and without the guest agent.
 */
const MemoryCharts = ({ stats, isRunning }) => {
  const { unit, value } =
    convertValueMap(
      'B',
      {
        available: isRunning ? stats.memory.free.datum : stats.memory.installed.datum,
        total: stats.memory.installed.datum,
        used: !isRunning ? 0 : stats.memory.installed.datum - stats.memory.free.datum,
      })
  const memory = round(value, 0)
  const history = (stats.memory['usage.history'] && stats.memory['usage.history'].datum) || []

  return (
    <UtilizationCard className={style['chart-card']}>
      <CardTitle>Memory</CardTitle>
      <CardBody>
        { !isRunning && <NoLiveData /> }
        { isRunning &&
        <React.Fragment>
          <UtilizationCardDetails>
            <UtilizationCardDetailsCount>{round(memory.available, 0)}</UtilizationCardDetailsCount>
            <UtilizationCardDetailsDesc>
              <UtilizationCardDetailsLine1>Available</UtilizationCardDetailsLine1>
              <UtilizationCardDetailsLine2>of {round(memory.total, 0)} {unit}</UtilizationCardDetailsLine2>
            </UtilizationCardDetailsDesc>
          </UtilizationCardDetails>

          <DonutChart
            id='donut-chart-memory'
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
              id='line-chart-memory'
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
  stats: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
}

export default MemoryCharts
