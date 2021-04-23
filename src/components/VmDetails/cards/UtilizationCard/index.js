import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { MsgContext } from '_/intl'

import { Grid, Row, Col } from '_/components/Grid'
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
  const { msg } = useContext(MsgContext)
  const stats = vm.has('statistics') ? vm.get('statistics').toJS() : undefined
  const isRunning = [ 'up' ].includes(vm.get('status'))

  const vCpus = vm.getIn(['cpu', 'vCPUs'])

  const idPrefix = 'vmdetail-utilization'

  return (
    <BaseCard
      className={style['utilization-card']}
      title={msg.utilization()}
      editable={false}
      idPrefix={idPrefix}
    >
      <Grid>
        <Row className={style['row-charts-box']}>
          <Col className={style['row-col-charts-box']}>
            <Col className={style['col-charts-box']}>
              { stats.cpu
                ? <CpuCharts cpuStats={stats.cpu} isRunning={isRunning} id={`${idPrefix}-cpu`} vcpus={vCpus} />
                : <NoLiveData message={msg.loadingTripleDot()} id={`${idPrefix}-cpu-no-data`} />
              }
            </Col>
            <Col className={style['col-charts-box']}>
              { stats.memory
                ? <MemoryCharts memoryStats={stats.memory} isRunning={isRunning} id={`${idPrefix}-memory`} />
                : <NoLiveData message={msg.loadingTripleDot()} id={`${idPrefix}-memory-no-data`} />
              }
            </Col>
          </Col>
          <Col className={style['row-col-charts-box']}>
            <Col className={style['col-charts-box']}>
              { stats.network
                ? <NetworkingCharts netStats={stats.network} isRunning={isRunning} id={`${idPrefix}-network`} />
                : <NoLiveData message={msg.loadingTripleDot()} id={`${idPrefix}-network-no-data`} />
              }
            </Col>
            <Col className={style['col-charts-box']}>
              { vm.has('disks')
                ? <DiskCharts vm={vm} diskStats={stats.disks} isRunning={isRunning} id={`${idPrefix}-disk`} />
                : <NoLiveData message={msg.loadingTripleDot()} id={`${idPrefix}-disk-no-data`} />
              }
            </Col>
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
