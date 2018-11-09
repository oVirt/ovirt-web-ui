import React from 'react'
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
  DonutChart,
} from 'patternfly-react'

import { donutMemoryTooltipContents } from '../../../utils'
import { convertValueMap, round } from '../../../../utils'
import { userFormatOfBytes } from '../../../../helpers'

import style from './style.css'

import NoLiveData from './NoLiveData'

/*
 * Disks, but intended to be in terms of guest agent reported data (file system viewpoint),
 * not in terms of storage allocation (infrastructure viewpoint - like dashboard/webadmin).
 *
 * NOTE: File system usage data from the guest agent is not currently (Aug, 2018) available
 *       via REST. Storage allocation is being used instead.
 */
const DiskCharts = ({ vm, isRunning, id, ...props }) => {
  const hasDisks = vm.get('disks').size > 0

  let actualSize = 0
  let provisionedSize = 0

  vm.get('disks').forEach(disk => {
    if (disk.get('type') === 'lun') {
      actualSize += disk.get('lunSize')
      provisionedSize += disk.get('lunSize')
    } else {
      actualSize += disk.get('actualSize')
      provisionedSize += disk.get('provisionedSize')
    }
  })

  const { unit, value: disks } = convertValueMap('B', { availableSize: provisionedSize - actualSize, provisionedSize })

  const usedFormated = userFormatOfBytes(actualSize)
  const available = round(disks.availableSize, 1)
  const total = round(disks.provisionedSize, 1)

  return (
    <UtilizationCard className={style['chart-card']} id={id}>
      <CardTitle>Disk <span style={{ fontSize: '55%', verticalAlign: 'super' }}>(storage allocations)</span></CardTitle>
      <CardBody>
        { !hasDisks &&
          <NoLiveData id={`${id}-no-live-data`} message='This VM has no attached disks.' />
        }
        { hasDisks &&
        <React.Fragment>
          <UtilizationCardDetails>
            <UtilizationCardDetailsCount id={`${id}-available`}>{available}</UtilizationCardDetailsCount>
            <UtilizationCardDetailsDesc>
              <UtilizationCardDetailsLine1>Unallocated</UtilizationCardDetailsLine1>
              <UtilizationCardDetailsLine2 id={`${id}-total`}>of {total} {unit} Provisioned</UtilizationCardDetailsLine2>
            </UtilizationCardDetailsDesc>
          </UtilizationCardDetails>

          <DonutChart
            id={`${id}-donut-chart`}
            data={{
              columns: [
                [`allocated`, actualSize],
                [`unallocated`, provisionedSize - actualSize],
              ],
              order: null,
            }}
            title={{
              primary: `${round(usedFormated.number, 0)}`,
              secondary: `${usedFormated.suffix} Allocated`,
            }}
            tooltip={{
              show: true,
              contents: donutMemoryTooltipContents,
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
  id: PropTypes.string.isRequired,
  vm: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
}

export default DiskCharts
