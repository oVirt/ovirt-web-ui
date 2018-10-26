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
  UtilizationBar,
} from 'patternfly-react'

import { round } from '_/utils'
import { donutMemoryTooltipContents } from '_/components/utils'
import { userFormatOfBytes } from '_/helpers'

import style from './style.css'

import NoLiveData from './NoLiveData'

const EmptyBlock = () => (
  <div className={style['no-history-chart']} />
)

const DiskBar = ({ path, total, used }) => {
  const { unit, value } =
    convertValueMap(
      'B',
      {
        total: total,
        used: used,
      })
  const thresholdError = 90
  const thresholdWarning = 70
  const usedInPercent = round(used / total * 100, 0)
  return <div className={style['disk-fs-box']}>
    <div className={style['disk-fs-name']}>{path}</div>
    <div className={style['disk-fs-bar']}>
      <UtilizationBar
        now={usedInPercent}
        thresholdWarning={thresholdWarning}
        thresholdError={thresholdError}
      />
    </div>
    <div className={style['disk-fs-used']}><strong>{round(value.used, 0)} of {round(value.total, 0)} {unit}</strong> Used</div>
  </div>
}

DiskBar.propTypes = {
  path: PropTypes.string.isRequired,
  total: PropTypes.number.isRequired,
  used: PropTypes.number.isRequired,
}

/*
 * Disks, but intended to be in terms of guest agent reported data (file system viewpoint),
 * not in terms of storage allocation (infrastructure viewpoint - like dashboard/webadmin).
 *
 * NOTE: File system usage data from the guest agent is not currently (Aug, 2018) available
 *       via REST. Storage allocation is being used instead.
 */
const DiskCharts = ({ vm, diskStats, isRunning, id, ...props }) => {
  const diskDetails = diskStats['usage'].datum

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

  const availableFormated = userFormatOfBytes(provisionedSize - actualSize)
  const totalFormated = userFormatOfBytes(provisionedSize)

  return (
    <UtilizationCard className={style['chart-card']} id={id}>
      <CardTitle>Disk <span style={{ fontSize: '55%', verticalAlign: 'super' }}>(storage allocations)</span></CardTitle>
      <CardBody>
        { !diskDetails && isRunning &&
          <NoLiveData id={`${id}-no-live-data`} message='It seems that no guest agent is configurated on VM.' />
        }
        { !diskDetails && !isRunning &&
          <NoLiveData id={`${id}-no-live-data`} />
        }
        { diskDetails &&
        <React.Fragment>
          <UtilizationCardDetails>
            <UtilizationCardDetailsCount id={`${id}-available`}>
              {round(availableFormated.number, 1)} {availableFormated.suffix !== totalFormated.suffix && availableFormated.suffix}
            </UtilizationCardDetailsCount>
            <UtilizationCardDetailsDesc>
              <UtilizationCardDetailsLine1>Unallocated</UtilizationCardDetailsLine1>
              <UtilizationCardDetailsLine2 id={`${id}-total`}>of {round(totalFormated.number, 1)} {totalFormated.suffix} Provisioned</UtilizationCardDetailsLine2>
            </UtilizationCardDetailsDesc>
          </UtilizationCardDetails>
          <div className={style['disk-fs-list']}>
            {
              diskDetails.map((disk) =>
                <DiskBar path={disk.path} total={parseInt(disk.total)} used={parseInt(disk.used)} />
              )
            }
          </div>
          {/* Disks don't have historic data but stub the space so the card stretches like the others */}
          <EmptyBlock />
        </React.Fragment>
        }
      </CardBody>
    </UtilizationCard>
  )
}
DiskCharts.propTypes = {
  id: PropTypes.string.isRequired,
  vm: PropTypes.object.isRequired,
  diskStats: PropTypes.object.isRequired,
  isRunning: PropTypes.bool,
}

export default DiskCharts
