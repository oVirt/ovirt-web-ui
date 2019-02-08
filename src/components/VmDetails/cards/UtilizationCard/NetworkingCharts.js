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
 * Render current Network % utilization as a donut chart and historic % utilization values
 * as a sparkline. Sparkline vales to go from oldest far left to most current on far
 * right.
 *
 * NOTE: This is a single % use value from the statistics pull. Could aggregate the
 *       statistics from the NICs to get different, finer grained details.
 */
const NetworkingCharts = ({ netStats, isRunning, id }) => {
  const haveNetworkStats = !!netStats['current.total']

  const used = (netStats['current.total'] && netStats['current.total'].datum) || 0
  const available = 100 - used

  // NOTE: Network history comes sorted from newest to oldest
  const history = ((netStats['usage.history'] && netStats['usage.history'].datum) || []).reverse()

  return (
    <UtilizationCard className={style['chart-card']} id={id}>
      <CardTitle>{msg.utilizationCardTitleNetworking()}</CardTitle>
      <CardBody>
        { !isRunning && <NoLiveData id={`${id}-no-live-data`} /> }
        { isRunning && !haveNetworkStats &&
          <NoLiveData id={`${id}-no-live-data`} message={msg.utilizationNoNetStats()} />
        }
        { isRunning && haveNetworkStats &&
        <React.Fragment>
          <UtilizationCardDetails>
            <UtilizationCardDetailsCount id={`${id}-available`}>{available}%</UtilizationCardDetailsCount>
            <UtilizationCardDetailsDesc>
              <UtilizationCardDetailsLine1>{msg.utilizationCardAvailable()}</UtilizationCardDetailsLine1>
              <UtilizationCardDetailsLine2>{msg.utilizationCardOf100()}</UtilizationCardDetailsLine2>
            </UtilizationCardDetailsDesc>
          </UtilizationCardDetails>

          <DonutChart
            id={`${id}-donut-chart`}
            data={{
              columns: [
                [msg.utilizationCardLegendUsedP(), used],
                [msg.utilizationCardLegendAvailableP(), available],
              ],
              order: null,
            }}
            title={{
              primary: `${used}`,
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
NetworkingCharts.propTypes = {
  id: PropTypes.string.isRequired,
  netStats: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
}

export default NetworkingCharts
