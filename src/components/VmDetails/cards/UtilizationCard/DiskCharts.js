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
  DonutChart,
} from 'patternfly-react'

import { round, convertValueMap } from '_/utils'
import { donutMemoryTooltipContents } from '_/components/utils'
import { userFormatOfBytes } from '_/helpers'

import style from './style.css'

import NoLiveData from './NoLiveData'
import NoHistoricData from './NoHistoricData'

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
  const diskDetails = diskStats && diskStats['usage'] && diskStats['usage'].datum

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

  const usedFormated = userFormatOfBytes(actualSize)
  const availableFormated = userFormatOfBytes(provisionedSize - actualSize)
  const totalFormated = userFormatOfBytes(provisionedSize)

  return (
    <UtilizationCard className={style['chart-card']} id={id}>
      <CardTitle>Disk</CardTitle>
      <CardBody>
        { vm.get('disks').size === 0 &&
          <NoLiveData id={`${id}-no-live-data`} message='It looks like no disk is attached to VM.' />
        }
        { vm.get('disks').size > 0 &&
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
            { !diskDetails &&
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
            }
            { isRunning && diskDetails &&
              <div className={style['disk-fs-list']}>
                {
                  diskDetails.map((disk) =>
                    <DiskBar key={disk.path} path={disk.path} total={disk.total} used={disk.used} />
                  )
                }
              </div>
            }
            { isRunning && !diskDetails &&
              <NoHistoricData message='It looks like no guest agent is configured on the VM.' />
            }
            {/*
                Disks don't have historic data but stub the space so the card stretches like the others,
                thus if message above doesn't show, need to insert EmptyBlock
              */}
            { !(isRunning && !diskDetails) &&
              <EmptyBlock />
            }
          </React.Fragment>
        }
      </CardBody>
    </UtilizationCard>
  )
}
DiskCharts.propTypes = {
  id: PropTypes.string.isRequired,
  vm: PropTypes.object.isRequired,
  diskStats: PropTypes.object,
  isRunning: PropTypes.bool,
}

export default DiskCharts
