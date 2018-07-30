import React from 'react'
import PropTypes from 'prop-types'

import {
  Popover,
  Icon,
  Button,
  OverlayTrigger,
  Tooltip,
} from 'patternfly-react'
import Immutable from 'immutable'

import style from '../../style.css'

import { msg } from '../../../../intl'

import Selectors from '../../../../selectors'
import { templateNameRenderer, getFormatedDateTime, userFormatOfBytes } from '../../../../helpers'
import { getOsHumanName } from '../../../utils'
import { sortDisksForDisplay } from '../../../VmDisks/utils'

import RestoreConfirmationModal from './RestoreConfirmationModal'

function getStatus (status) {
  return status
    ? <span className={style['status-icon']}><Icon type='pf' name='on-running' className={style['green']} />{msg.on()}</span>
    : <span className={style['status-icon']}><Icon type='pf' name='off' />{msg.off()}</span>
}

const diskRender = (disk) => {
  const provSize = userFormatOfBytes(disk.get('provisionedSize'))
  const actSize = userFormatOfBytes(disk.get('actualSize'), provSize.suffix)
  return <div key={disk.get('id')}>
    {`${disk.get('name')} (${actSize.str} used / ${provSize.str})`}
  </div>
}

const statusMap = {
  'in_preview': msg.inPreview(),
  'locked': msg.locked(),
  'ok': msg.ok(),
}

const SnapshotDetail = ({ snapshot, vmId, ...otherProps }) => {
  const template = Selectors.getTemplateById(snapshot.getIn(['vm', 'template', 'id']))
  const time = getFormatedDateTime(snapshot.get('date'))

  const snapshotMemoryState = snapshot.get('persistMemoryState') && msg.memoryIncluded()

  const disksToRender = sortDisksForDisplay(snapshot.get('disks', Immutable.fromJS([])))
  const showMoreDisks = disksToRender.size > 2
  const diskToShow = disksToRender.slice(0, 2)
  const additionalDisk = disksToRender.slice(2)

  return <Popover
    id={`snapshot-popover-${snapshot.get('id')}`}
    title={snapshot.get('description')}
    bsClass={`${style['popover']} popover`}
    {...otherProps}
  >
    <div className={style['snapshot-detail-container']}>
      <dl className={style['snapshot-properties']}>
        <dt>
          {msg.created()}
        </dt>
        <dd>
          {`${time.time} ${time.date}`}
        </dd>
        <dt>
          {msg.operatingSystem()}
        </dt>
        <dd>
          {getOsHumanName(snapshot.getIn(['vm', 'os', 'type']))}
        </dd>
        <dt>
          {msg.memory()}
        </dt>
        <dd>
          {userFormatOfBytes(snapshot.getIn(['vm', 'memory', 'total'])).str} {snapshotMemoryState}
        </dd>
        <dt>
          {msg.cpus()}
        </dt>
        <dd>
          {snapshot.getIn(['vm', 'cpu', 'vCPUs'])}
        </dd>
        <dt>
          {msg.status()}
        </dt>
        <dd>
          {statusMap[snapshot.get('status')]}
        </dd>
      </dl>
      <dl className={style['snapshot-properties']}>
        <dt>
          {msg.template()}
        </dt>
        <dd>
          {template ? templateNameRenderer(template) : ''}
        </dd>
        <dt>
          {msg.cdromBoot()}
        </dt>
        <dd>
          {snapshot.getIn(['vm', 'cdrom', 'file', 'id']) ? snapshot.getIn(['cdrom', 'file', 'id']) : msg.empty() }
        </dd>
        <dt>
          {msg.cloudInit()}
        </dt>
        <dd>
          {getStatus(snapshot.getIn(['vm', 'cloudInit', 'enabled']))}
        </dd>
        <dt>
          {msg.bootMenu()}
        </dt>
        <dd>
          {getStatus(snapshot.getIn(['vm', 'bootMenuEnabled']))}
        </dd>
        <dt>
          {msg.disks()}
        </dt>
        <dd>
          <div className={style['snapshot-disk-list']}>
            {diskToShow && diskToShow.map(diskRender)}
            {
              showMoreDisks &&
              <OverlayTrigger
                overlay={<Tooltip id={`snapshot-disk-tooltip-${snapshot.get('id')}`}>
                  {
                    additionalDisk && additionalDisk.map(diskRender)
                  }
                </Tooltip>}
                placement='bottom'
                trigger='click'
                rootClose
                key='info'
              >
                <a>Show more</a>
              </OverlayTrigger>
            }
          </div>
        </dd>
      </dl>
    </div>
    <div style={{ textAlign: 'left' }}><RestoreConfirmationModal snapshot={snapshot} vmId={vmId}><Button bsStyle='default'>{ msg.restoreSnapshot() }</Button></RestoreConfirmationModal></div>
  </Popover>
}

SnapshotDetail.propTypes = {
  snapshot: PropTypes.object.isRequired,
  vmId: PropTypes.string.isRequired,
}

export default SnapshotDetail
