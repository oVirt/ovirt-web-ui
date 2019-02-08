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

import { msg } from '_/intl'
import { round, floor, convertValueMap } from '_/utils'
import { donutMemoryTooltipContents } from '_/components/utils'
import { userFormatOfBytes, isWindows } from '_/helpers'

import style from './style.css'

import NoLiveData from './NoLiveData'
import NoHistoricData from './NoHistoricData'

const EmptyBlock = () => (
  <div className={style['no-history-chart']} />
)

const DiskBar = ({ path, total, used, isVmWindows }) => {
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
    <div className={style['disk-fs-name']}>{ isVmWindows ? path.toUpperCase() : path }</div>
    <div className={style['disk-fs-bar']}>
      <UtilizationBar
        now={usedInPercent}
        thresholdWarning={thresholdWarning}
        thresholdError={thresholdError}
      />
      <div
        className={style['disk-fs-used']}
        dangerouslySetInnerHTML={{
          __html: msg.utilizationCardDiskUsed({
            used: round(value.used, 0),
            total: round(value.total, 0),
            storageUnits: unit,
          }),
        }}
      />
    </div>
  </div>
}
DiskBar.propTypes = {
  path: PropTypes.string.isRequired,
  total: PropTypes.number.isRequired,
  used: PropTypes.number.isRequired,
  isVmWindows: PropTypes.bool,
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

  const usedFormated = userFormatOfBytes(actualSize, null, 1)
  const availableFormated = userFormatOfBytes(provisionedSize - actualSize, null, 1)
  const totalFormated = userFormatOfBytes(provisionedSize, null, 1)

  const availableMemoryPercision = availableFormated.number >= 10
    ? availableFormated.number >= 100 ? 0 : 1
    : 2

  const isVmWindows = isWindows(vm.getIn(['os', 'type']))

  return (
    <UtilizationCard className={style['chart-card']} id={id}>
      <CardTitle>{msg.utilizationCardTitleDisk()}</CardTitle>
      <CardBody>
        { vm.get('disks').size === 0 &&
          <NoLiveData id={`${id}-no-live-data`} message={msg.utilizationCardNoAttachedDisks()} />
        }
        { vm.get('disks').size > 0 &&
          <React.Fragment>
            <UtilizationCardDetails>
              <UtilizationCardDetailsCount id={`${id}-available`}>
                {msg.utilizationCardUnitNumber({
                  number: floor(availableFormated.number, availableMemoryPercision),
                  storageUnits: availableFormated.suffix !== totalFormated.suffix && availableFormated.suffix,
                })}
              </UtilizationCardDetailsCount>
              <UtilizationCardDetailsDesc>
                <UtilizationCardDetailsLine1>{msg.utilizationCardUnallocated()}</UtilizationCardDetailsLine1>
                <UtilizationCardDetailsLine2 id={`${id}-total`}>
                  {msg.utilizationCardOfProvisioned({
                    number: round(totalFormated.number, 1),
                    storageUnits: totalFormated.suffix,
                  })}
                </UtilizationCardDetailsLine2>
              </UtilizationCardDetailsDesc>
            </UtilizationCardDetails>
            { !diskDetails &&
              <DonutChart
                id={`${id}-donut-chart`}
                data={{
                  columns: [
                    [msg.utilizationCardAllocated(), actualSize],
                    [msg.utilizationCardUnallocated(), provisionedSize - actualSize],
                  ],
                  order: null,
                }}
                title={{
                  primary: `${round(usedFormated.number, 0)}`,
                  secondary: msg.utilizationCardUnitAllocated({ storageUnit: usedFormated.suffix }),
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
                    <DiskBar key={disk.path} path={disk.path} total={disk.total} used={disk.used} isVmWindows={isVmWindows} />
                  )
                }
              </div>
            }
            { isRunning && !diskDetails &&
              <NoHistoricData message={msg.utilizationCardNoGuestAgent()} />
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
