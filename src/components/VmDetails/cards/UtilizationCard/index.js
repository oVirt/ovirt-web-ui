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

  const loadingMessage = 'Loading...'

  return (
    <BaseCard className={style['utilization-card']} title='Utilization' editable={false}>
      <Grid>
        <Row>
          <Col>
            { stats.cpu
              ? <CpuCharts cpuStats={stats.cpu} isRunning={isRunning} />
              : <NoLiveData message={loadingMessage} />
            }
          </Col>
          <Col>
            { stats.memory
              ? <MemoryCharts memoryStats={stats.memory} isRunning={isRunning} />
              : <NoLiveData message={loadingMessage} />
            }
          </Col>
          <Col>
            { stats.network
              ? <NetworkingCharts netStats={stats.network} isRunning={isRunning} />
              : <NoLiveData message={loadingMessage} />
            }
          </Col>
          <Col>
            { vm.has('disks')
              ? <DiskCharts vm={vm} isRunning={isRunning} />
              : <NoLiveData message={loadingMessage} />
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
