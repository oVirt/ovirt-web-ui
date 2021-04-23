import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import {
  CardBody,
  CardTitle,
  UtilizationCard,
  UtilizationCardDetails,
  UtilizationCardDetailsCount,
  UtilizationCardDetailsDesc,
  UtilizationCardDetailsLine1,
  UtilizationCardDetailsLine2,
} from 'patternfly-react'
import BarChart from './UtilizationCharts/BarChart'
import DonutChart from './UtilizationCharts/DonutChart'

import { MsgContext } from '_/intl'
import { round, floor, convertValueMap } from '_/utils'
import { userFormatOfBytes, isWindows } from '_/helpers'

import style from './style.css'

import NoHistoricData from './NoHistoricData'
import NoLiveData from './NoLiveData'

const EmptyBlock = () => (
  <div className={style['no-history-chart']} />
)

/*
 * Disks, but intended to be in terms of guest agent reported data (file system viewpoint),
 * not in terms of storage allocation (infrastructure viewpoint - like dashboard/webadmin).
 *
 * NOTE: File system usage data from the guest agent is not currently (Aug, 2018) available
 *       via REST. Storage allocation is being used instead.
 */
const DiskCharts = ({ vm, diskStats, isRunning, id, ...props }) => {
  const { msg } = useContext(MsgContext)
  const diskDetails = diskStats && diskStats.usage && diskStats.usage.datum
  const hasDiskDetails = diskDetails && diskDetails.length > 0

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
            { !hasDiskDetails &&
              <DonutChart
                id={`${id}-donut-chart`}
                data={[
                  {
                    x: msg.utilizationCardAllocated(),
                    y: actualSize,
                    label: `${msg.utilizationCardLegendUsed()}: ${usedFormated.rounded} ${usedFormated.suffix}`,
                  },
                  {
                    x: msg.utilizationCardUnallocated(),
                    y: provisionedSize - actualSize,
                    label: `${msg.utilizationCardLegendAvailable()}: ${availableFormated.rounded} ${availableFormated.suffix}`,
                  },
                ]}
                subTitle={msg.utilizationCardUnitAllocated({ storageUnit: usedFormated.suffix })}
                title={`${round(usedFormated.number, 0)}`}
              />
            }
            { isRunning && hasDiskDetails &&
              <div className={style['disk-fs-list']}>
                <BarChart
                  id={`${id}-bar-chart`}
                  data={
                    diskDetails.map((disk) => {
                      const usedInPercent = round(disk.used / disk.total * 100, 0)
                      return { x: isVmWindows ? disk.path.toUpperCase() : disk.path, y: usedInPercent, total: disk.total, used: disk.used }
                    })
                  }
                  additionalLabel={({ total, used }) => {
                    const { unit, value } = convertValueMap('B', { total, used })
                    return msg.utilizationCardDiskUsed({
                      used: round(value.used, 0),
                      total: round(value.total, 0),
                      storageUnits: unit,
                    })
                  }}
                  labels={datum => datum ? `${msg.utilizationCardLegendUsed()} ${datum.y}%` : null}
                  thresholdWarning={70}
                  thresholdError={90}
                />
              </div>
            }
            { isRunning && !hasDiskDetails &&
              <NoHistoricData id={`${id}-no-historic-data`} message={msg.utilizationCardNoGuestAgent()} />
            }
            {/*
              Disks don't have historic data but stub the space so the card stretches like the others,
              thus if message above doesn't show, need to insert EmptyBlock
            */}
            { !(isRunning && !hasDiskDetails) &&
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
