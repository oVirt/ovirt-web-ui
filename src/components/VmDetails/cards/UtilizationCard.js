import React from 'react'
import PropTypes from 'prop-types'

import { convertValueMap as convertUnits } from '../../../utils/storage-conversion'
import { round } from '../../../utils/round'

import { Grid, Row, Col } from '../GridComponents'
import BaseCard from '../BaseCard'
// import style from '../style.css'

import {
  patternfly,
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

const CpuCharts = ({ vm }) => (
  <PFUtilizationCard>
    <CardTitle>CPU</CardTitle>
    <CardBody>
      <UtilizationCardDetails>
        <UtilizationCardDetailsCount>58%</UtilizationCardDetailsCount>
        <UtilizationCardDetailsDesc>
          <UtilizationCardDetailsLine1>Available</UtilizationCardDetailsLine1>
          <UtilizationCardDetailsLine2>of 100%</UtilizationCardDetailsLine2>
        </UtilizationCardDetailsDesc>
      </UtilizationCardDetails>
      <DonutChart
        id='donut-chart-cpu'
        data={{
          columns: [['Used', 42], ['Available', 58]],
          groups: [['used', 'available']],
          colors: { Used: '#cc0000', Avaliable: '#3f9c35' },
        }}
        title={{ type: 'max' }}
      />
      {/* tooltip={{contents: pfGetUtilizationDonutTooltipContents()}} */}
      {/* TODO: Tooltip on the donut chart! */}

      <SparklineChart
        id='line-chart-cpu'
        data={{
          columns: [
            ['%', 11, 12, 13, 55, 92, 76, 76, 42, 42, 42, 36, 1, 1, 100],
          ],
          type: 'area',
        }}
      />
    </CardBody>
  </PFUtilizationCard>
)
CpuCharts.propTypes = { vm: PropTypes.object.isRequired }

const MemoryCharts = ({ stats }) => {
  const { unit, value: memory } = convertUnits('B', {
    available: stats.memory.free.datum,
    total: stats.memory.installed.datum,
    used: stats.memory.installed.datum - stats.memory.free.datum, // TODO: Is this ok?
  })
  const history = (stats.memory['usage.history'] && stats.memory['usage.history'].datum) || [] // TODO: Unit Convert?

  console.info(`VM memory \u2192 unit: ${unit}, data: ${JSON.stringify(memory)}, history: ${history}`)
  return (
    <PFUtilizationCard>
      <CardTitle>Memory</CardTitle>
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
            primary: round(memory.used, 0),
            secondary: `${unit} Used`,
          }}
          tooltip={{
            show: true,
            contents: patternfly.pfDonutTooltipContents, // patternfly.pfGetUtilizationDonutTooltipContentsFn,
          }}
        />

        <SparklineChart
          id='line-chart-memory'
          data={{
            columns: [
              ['B', ...history],
            ],
            type: 'area',
          }}
        />
      </CardBody>
    </PFUtilizationCard>
  )
}
MemoryCharts.propTypes = {
  stats: PropTypes.object.isRequired,
}

const NetworkingCharts = ({ vm }) => (
  <PFUtilizationCard>
    <CardTitle>Networking</CardTitle>
    <CardBody>
      <UtilizationCardDetails>
        <UtilizationCardDetailsCount>15</UtilizationCardDetailsCount>
        <UtilizationCardDetailsDesc>
          <UtilizationCardDetailsLine1>Available</UtilizationCardDetailsLine1>
          <UtilizationCardDetailsLine2>of 100Mbps</UtilizationCardDetailsLine2>
        </UtilizationCardDetailsDesc>
      </UtilizationCardDetails>
      <DonutChart
        id='donut-chart-network'
        data={{
          columns: [['Used', 15], ['Available', 85]],
          groups: [['used', 'available']],
          colors: { Used: '#cc0000', Avaliable: '#3f9c35' },
        }}
        title={{ type: 'max' }}
      />
      {/* tooltip={{contents: pfGetUtilizationDonutTooltipContents()}} */}
      {/* TODO: Tooltip on the donut chart! */}

      <SparklineChart
        id='line-chart-network'
        data={{
          columns: [
            ['%', 11, 12, 13, 55, 92, 76, 76, 42, 42, 42, 36, 1, 1, 100],
          ],
          type: 'area',
        }}
      />
    </CardBody>
  </PFUtilizationCard>
)
NetworkingCharts.propTypes = { vm: PropTypes.object.isRequired }

const DiskCharts = ({ vm }) => (
  <PFUtilizationCard>
    <CardTitle>Disk</CardTitle>
    <CardBody>
      <UtilizationCardDetails>
        <UtilizationCardDetailsCount>19</UtilizationCardDetailsCount>
        <UtilizationCardDetailsDesc>
          <UtilizationCardDetailsLine1>Available</UtilizationCardDetailsLine1>
          <UtilizationCardDetailsLine2>of 50GiB</UtilizationCardDetailsLine2>
        </UtilizationCardDetailsDesc>
      </UtilizationCardDetails>
      <DonutChart
        id='donut-chart-disk'
        data={{
          columns: [['Used', 19], ['Available', 31]],
          groups: [['used', 'available']],
          colors: { Used: '#cc0000', Avaliable: '#3f9c35' },
        }}
        title={{ type: 'max' }}
      />
      {/* tooltip={{contents: pfGetUtilizationDonutTooltipContents()}} */}
      {/* TODO: Tooltip on the donut chart! */}

      <SparklineChart
        id='line-chart-disk'
        data={{
          columns: [
            ['%', 11, 12, 13, 55, 92, 76, 76, 42, 42, 42, 36, 1, 1, 100],
          ],
          type: 'area',
        }}
      />
    </CardBody>
  </PFUtilizationCard>
)
DiskCharts.propTypes = { vm: PropTypes.object.isRequired }

/**
 * VM dashboard style Utilization charts (CPU, Memory, Network)
 */
const UtilizationCard = ({ vm }) => {
  const stats = vm.get('statistics', {}).toJS()
  console.info('VM stats', stats)

  return (
    <BaseCard title='Utilization' editable={false}>{({ isEditing }) => (
      <Grid>
        <Row>
          <Col><CpuCharts vm={vm} /></Col>
          <Col>
            { stats.memory ? <MemoryCharts stats={stats} /> : <div>Loading...</div> }
          </Col>
          <Col><NetworkingCharts vm={vm} /></Col>
          <Col><DiskCharts vm={vm} /></Col>
        </Row>
      </Grid>
    )}
    </BaseCard>
  )
}
UtilizationCard.propTypes = {
  vm: PropTypes.object,
}

export default UtilizationCard
