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
} from 'patternfly-react'

import { convertValueMap, round } from '../../../../utils'

import style from './style.css'

import NoLiveData from './NoLiveData'

/*
 * Disks, but intended to be in terms of guest agent reported data (file system viewpoint),
 * not in terms of storage allocation (infrastructure viewpoint - like dashboard/webadmin).
 *
 * NOTE: File system usage data from the guest agent is not currently (Aug, 2018) available
 *       via REST. Storage allocation is being used instead.
 */
const DiskCharts = ({ vm, isRunning, ...props }) => {
  const hasDisks = vm.get('disks').size > 0

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
    <UtilizationCard className={style['chart-card']}>
      <CardTitle>Disk <span style={{ fontSize: '55%', verticalAlign: 'super' }}>(storage allocations)</span></CardTitle>
      <CardBody>
        { !hasDisks &&
          <NoLiveData message='This VM has no attached disks.' />
        }
        { hasDisks &&
        <React.Fragment>
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
                [`${unit} unallocated`, available],
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
        </React.Fragment>
        }
      </CardBody>
    </UtilizationCard>
  )
}
DiskCharts.propTypes = {
  vm: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
}

export default DiskCharts
