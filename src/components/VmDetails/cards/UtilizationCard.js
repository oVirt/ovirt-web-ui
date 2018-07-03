import React from 'react'
import PropTypes from 'prop-types'

import BaseCard from '../BaseCard'
// import style from '../style.css'

import {
  CardTitle,
  CardBody,
  CardGrid,
  Row,
  Col,
  UtilizationCard as PFUtilizationCard,
  UtilizationCardDetails,
  UtilizationCardDetailsCount,
  UtilizationCardDetailsDesc,
  UtilizationCardDetailsLine1,
  UtilizationCardDetailsLine2,
  DonutChart,
  SparklineChart,
} from 'patternfly-react'

/**
 * VM dashboard style Utilization charts (CPU, Memory, Network)
 */
const UtilizationCard = ({ vm }) => (
  <BaseCard title='Utilization' editable={false}>{({ isEditing }) => (
    <CardGrid>
      <Row>
        <Col md={3}>
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
        </Col>

        <Col md={3}>
          <PFUtilizationCard>
            <CardTitle>Memory</CardTitle>
            <CardBody>
              <UtilizationCardDetails>
                <UtilizationCardDetailsCount>4.6</UtilizationCardDetailsCount>
                <UtilizationCardDetailsDesc>
                  <UtilizationCardDetailsLine1>Available</UtilizationCardDetailsLine1>
                  <UtilizationCardDetailsLine2>of 15.4 GiB</UtilizationCardDetailsLine2>
                </UtilizationCardDetailsDesc>
              </UtilizationCardDetails>
              <DonutChart
                id='donut-chart-cpu'
                data={{
                  columns: [['Used', (4.6 / 15.4)], ['Available', 15.4]],
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
        </Col>

        <Col md={3}>
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
                id='donut-chart-cpu'
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
        </Col>

        <Col md={3}>
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
                id='donut-chart-cpu'
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
        </Col>
      </Row>
    </CardGrid>
  )}</BaseCard>
)
UtilizationCard.propTypes = {
  vm: PropTypes.object,
}

export default UtilizationCard
