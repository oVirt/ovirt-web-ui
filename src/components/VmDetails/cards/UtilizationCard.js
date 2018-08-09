import React from 'react'
import PropTypes from 'prop-types'

import { convertValueMap } from '../../../utils/storage-conversion'
import { round } from '../../../utils/round'

import { Grid, Row, Col } from '../GridComponents'
import BaseCard from '../BaseCard'
import style from './UtilizationCard.css'

import {
  patternfly,
  Icon,
  CardTitle,
  CardBody,
  UtilizationCard as PFUtilizationCard,
  UtilizationCardDetails,
  UtilizationCardDetailsCount,
  UtilizationCardDetailsDesc,
  UtilizationCardDetailsLine1,
  UtilizationCardDetailsLine2,
  DonutChart,
  SparklineChart,
} from 'patternfly-react'

const CpuCharts = ({ stats, isRunning }) => {
  const cpuUsed = stats.cpu['current.guest'].datum
  const cpuAvailable = 100 - cpuUsed
  const history = (stats.cpu['usage.history'] && stats.cpu['usage.history'].datum) || [] // TODO: check the order of values is as expected

  return (
    <PFUtilizationCard>
      <CardTitle>CPU</CardTitle>
      { !isRunning && <NoLiveData /> }
      { isRunning &&
        <CardBody>
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
        </CardBody>
      }
    </PFUtilizationCard>
  )
}
CpuCharts.propTypes = {
  stats: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
}

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
    <PFUtilizationCard>
      <CardTitle>Memory</CardTitle>
      { !isRunning && <NoLiveData /> }
      { isRunning &&
        <CardBody>
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
        </CardBody>
      }
    </PFUtilizationCard>
  )
}
MemoryCharts.propTypes = {
  stats: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
}

/*
 * NOTE: This is a single % use value from the statistics pull. Could aggregate the
 *       statistics from the NICs to get different, finer grained details.
 */
const NetworkingCharts = ({ stats, isRunning }) => {
  const haveNetworkStats = stats && stats.network && stats.network['current.total']

  const used = (stats.network['current.total'] && stats.network['current.total'].datum) || 0
  const available = 100 - used
  const history = (stats.network['usage.history'] && stats.network['usage.history'].datum) || []

  return (
    <PFUtilizationCard>
      <CardTitle>Networking</CardTitle>
      { !isRunning && <NoLiveData /> }
      { isRunning && !haveNetworkStats && <NoLiveData message='Network utilization is not currently available for this VM.' />}
      { isRunning && haveNetworkStats &&
        <CardBody>
          <UtilizationCardDetails>
            <UtilizationCardDetailsCount>{available}%</UtilizationCardDetailsCount>
            <UtilizationCardDetailsDesc>
              <UtilizationCardDetailsLine1>Available</UtilizationCardDetailsLine1>
              <UtilizationCardDetailsLine2>of 100%</UtilizationCardDetailsLine2>
            </UtilizationCardDetailsDesc>
          </UtilizationCardDetails>

          <DonutChart
            id='donut-chart-network'
            data={{
              columns: [
                [`% Used`, used],
                [`% Available`, available],
              ],
              order: null,
            }}
            title={{
              primary: `${used}`,
              secondary: `% Used`,
            }}
            tooltip={{
              show: true,
              contents: patternfly.pfDonutTooltipContents,
            }}
          />

          { history.length === 0 && <NoHistoricData /> }
          { history.length > 0 &&
            <SparklineChart
              id='line-chart-network'
              data={{
                columns: [['%', ...history]],
                type: 'area',
              }}
            />
          }
        </CardBody>
      }
    </PFUtilizationCard>
  )
}
NetworkingCharts.propTypes = {
  stats: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
}

/*
 * Disks, but intended to be in terms of guest agent reported data (file system viewpoint),
 * not in terms of storage allocation (infrastructure viewpoint - like dashboard/webadmin).
 *
 * NOTE: File system usage data from the guest agent is not currently (Aug, 2018) available
 *       via REST. Storage allocation is being used instead.
 */
const DiskCharts = ({ vm, isRunning, ...props }) => {
  let actualSize = 0
  let provisionedSize = 0

  vm.get('disks').forEach(disk => {
    actualSize += disk.get('actualSize')
    provisionedSize += disk.get('provisionedSize')
  })

  const { unit, value: disks } = convertValueMap('B', { actualSize, provisionedSize })
  const used = round(disks.actualSize, 1)
  const available = round(disks.provisionedSize - disks.actualSize, 1)
  const total = round(disks.provisionedSize, 1)

  return (
    <PFUtilizationCard {...props}>
      <CardTitle>Disk <span style={{ fontSize: '55%', verticalAlign: 'super' }}>(showing storage allocations)</span></CardTitle>
      <CardBody>
        <UtilizationCardDetails>
          <UtilizationCardDetailsCount>{available}</UtilizationCardDetailsCount>
          <UtilizationCardDetailsDesc>
            <UtilizationCardDetailsLine1>Available</UtilizationCardDetailsLine1>
            <UtilizationCardDetailsLine2>of {total} {unit} Provisioned</UtilizationCardDetailsLine2>
          </UtilizationCardDetailsDesc>
        </UtilizationCardDetails>

        <DonutChart
          id='donut-chart-disk'
          data={{
            columns: [
              [`${unit} allocated`, used],
              [`${unit} remaining provisioned space`, available],
            ],
            order: null,
          }}
          title={{
            primary: `${used}`,
            secondary: `${unit} Allocated`,
          }}
          tooltip={{
            show: true,
            contents: patternfly.pfDonutTooltipContents,
          }}
        />

        {/* Disks don't have historic data */}
      </CardBody>
    </PFUtilizationCard>
  )
}
DiskCharts.propTypes = {
  vm: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
}

/*
 * Standard "No Data" component to display when a VM cannot provide the data
 * necessary to render one of the charts. The VM can be down, have no guest agent,
 * or the API may not return parts of the statistics data needed.
 */
const NoLiveData = ({ title, message }) => (
  <CardBody className={style['no-data-card-body']}>
    <div className={style['no-data-icon']}>
      <Icon type='fa' name='bar-chart' />
    </div>
    <div className={style['no-data-title']}>
      { title || 'No Data Available' }
    </div>
    <div className={style['no-data-message']}>
      { message || 'Utilization data is only available for a running VM.' }
    </div>
  </CardBody>
)
NoLiveData.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
}

/*
 * Replaces a `SparklineChart` in the Charts cards when historic data isn't available.
 */
const NoHistoricData = ({ message }) => (
  <div className={style['no-history-chart']}>
    <div className={style['no-history-chart-icon']}>
      <Icon type='pf' name='info' />
    </div>
    <div className={style['no-history-chart-message']}>
      { message || 'No historic data available' }
    </div>
  </div>
)
NoHistoricData.propTypes = {
  message: PropTypes.string,
}

/**
 * VM dashboard style Utilization charts (CPU, Memory, Network)
 */
const UtilizationCard = ({ vm, onEditChange }) => {
  const stats = vm.has('statistics') ? vm.get('statistics').toJS() : undefined
  const isRunning = [ 'up' ].includes(vm.get('status'))

  const loadingMessage = 'Loading...'

  return (
    <BaseCard className={style['utilization-card-container']} title='Utilization' editable={false}>
      <Grid className={style['grid']}>
        <Row>
          <Col>
            { stats.cpu ? <CpuCharts stats={stats} isRunning={isRunning} /> : <NoLiveData message={loadingMessage} /> }
          </Col>
          <Col>
            { stats.memory ? <MemoryCharts stats={stats} isRunning={isRunning} /> : <NoLiveData message={loadingMessage} /> }
          </Col>
          <Col>
            { stats.network ? <NetworkingCharts stats={stats} isRunning={isRunning} /> : <NoLiveData message={loadingMessage} /> }
          </Col>
          <Col>
            { vm.has('disks') ? <DiskCharts vm={vm} isRunning={isRunning} /> : <NoLiveData message={loadingMessage} /> }
          </Col>
        </Row>
      </Grid>
    </BaseCard>
  )
}
UtilizationCard.propTypes = {
  vm: PropTypes.object.isRequired,
  onEditChange: PropTypes.func.isRequired,
}

export default UtilizationCard
