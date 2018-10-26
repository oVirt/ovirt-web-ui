import React from 'react'
import PropTypes from 'prop-types'

import { Grid, Row, Col } from '../../GridComponents'
import BaseCard from '../../BaseCard'
import style from './style.css'

import CpuCharts from './CpuCharts'
import MemoryCharts from './MemoryCharts'
import NetworkingCharts from './NetworkingCharts'
import DiskCharts from './DiskCharts'
import NoLiveData from './NoLiveData'

/**
 * VM dashboard style Utilization charts (CPU, Memory, Network, Disk)
 */
const UtilizationCard = ({ vm }) => {
  const stats = vm.has('statistics') ? vm.get('statistics').toJS() : undefined
  const isRunning = [ 'up' ].includes(vm.get('status'))

  const idPrefix = 'vmdetail-utilization'

  const loadingMessage = 'Loading...'

  return (
    <BaseCard className={style['utilization-card']} title='Utilization' editable={false} idPrefix={idPrefix}>
      <Grid>
        <Row>
          <Col>
            { stats.cpu
              ? <CpuCharts cpuStats={stats.cpu} isRunning={isRunning} id={`${idPrefix}-cpu`} />
              : <NoLiveData message={loadingMessage} id={`${idPrefix}-cpu-no-data`} />
            }
          </Col>
          <Col>
            { stats.memory
              ? <MemoryCharts memoryStats={stats.memory} isRunning={isRunning} id={`${idPrefix}-memory`} />
              : <NoLiveData message={loadingMessage} id={`${idPrefix}-memory-no-data`} />
            }
          </Col>
          <Col>
            { stats.network
              ? <NetworkingCharts netStats={stats.network} isRunning={isRunning} id={`${idPrefix}-network`} />
              : <NoLiveData message={loadingMessage} id={`${idPrefix}-network-no-data`} />
            }
          </Col>
          <Col>
            { vm.has('disks') && stats.disks
              ? <DiskCharts vm={vm} diskStats={stats.disks} isRunning={isRunning} id={`${idPrefix}-disk`} />
              : <NoLiveData message={loadingMessage} id={`${idPrefix}-disk-no-data`} />
            }
          </Col>
        </Row>
      </Grid>
    </BaseCard>
  )
}
UtilizationCard.propTypes = {
  vm: PropTypes.object.isRequired,
}

export default UtilizationCard
