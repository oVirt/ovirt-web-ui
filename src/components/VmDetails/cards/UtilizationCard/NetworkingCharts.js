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
 * Render current Network % utilization as a donut chart and historic % utilization values
 * as a sparkline. Sparkline vales to go from oldest far left to most current on far
 * right.
 *
 * NOTE: This is a single % use value from the statistics pull. Could aggregate the
 *       statistics from the NICs to get different, finer grained details.
 */
const NetworkingCharts = ({ netStats, isRunning, id }) => {
  const { msg } = useContext(MsgContext)
  const haveNetworkStats = !!netStats['current.total']

  const used = (netStats['current.total'] && netStats['current.total'].firstDatum) || 0
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
            data={[
              {
                x: msg.utilizationCardLegendUsedP(),
                y: used,
                label: `${msg.utilizationCardLegendUsed()}: ${used}%`,
              },
              {
                x: msg.utilizationCardLegendAvailableP(),
                y: available,
                label: `${msg.utilizationCardAvailable()}: ${available}%`,
              },
            ]}
            subTitle={msg.utilizationCardLegendUsedP()}
            title={`${used}`}
          />
          { history.length === 0 && <NoHistoricData id={`${id}-no-historic-data`} /> }
          { history.length > 0 &&
            <AreaChart
              id={`${id}-history-chart`}
              data={history.map((item, i) => ({ x: i, y: item, name: 'cpu' }))}
              labels={datum => `${datum.y}%`}
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
