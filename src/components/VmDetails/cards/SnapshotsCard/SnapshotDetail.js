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

import style from './style.css'

import { withMsg } from '_/intl'

import Selectors from '_/selectors'
import { templateNameRenderer, getFormatedDateTime, userFormatOfBytes, localeCompare } from '_/helpers'
import { getOsHumanName, sortDisksForDisplay } from '_/components/utils'

import RestoreConfirmationModal from './RestoreConfirmationModal'

const Status = ({ status, msg }) => {
  return status
    ? <span className={style['status-icon']}><Icon type='pf' name='on-running' className={style['green']} />{msg.on()}</span>
    : <span className={style['status-icon']}><Icon type='pf' name='off' />{msg.off()}</span>
}

Status.propTypes = {
  status: PropTypes.bool.isRequired,
  msg: PropTypes.object.isRequired,
}

const diskRender = (idPrefix, disk, index) => {
  const provSize = userFormatOfBytes(disk.get('provisionedSize'))
  const actSize = userFormatOfBytes(disk.get('actualSize'), provSize.suffix)
  return <div key={disk.get('id')} id={`${idPrefix}-${disk.get('name')}-${index}`}>
    {`${disk.get('name')} (${actSize.str} used / ${provSize.str})`}
  </div>
}

const nicRender = (idPrefix, nic) => {
  return <div key={nic.get('id')} id={`${idPrefix}-${nic.get('name')}`}>
    {nic.get('name')}
  </div>
}

const statusMap = (msg) => ({
  'in_preview': msg.inPreview(),
  'locked': msg.locked(),
  'ok': msg.ok(),
})

const SnapshotDetail = ({ snapshot, vmId, restoreDisabled, id, isPoolVm, msg, locale, ...otherProps }) => {
  const template = Selectors.getTemplateById(snapshot.getIn(['vm', 'template', 'id']))
  const time = getFormatedDateTime(snapshot.get('date'))

  const snapshotMemoryState = snapshot.get('persistMemoryState') && msg.memoryIncluded()

  const disksToRender = sortDisksForDisplay(snapshot.get('disks', Immutable.fromJS([])), locale)
  const showMoreDisks = disksToRender.size > 2
  const diskToShow = disksToRender.slice(0, 2)
  const additionalDisk = disksToRender.slice(2)

  const nicsToRender = snapshot.get('nics', Immutable.fromJS([])).sort((a, b) => localeCompare(a.get('name'), b.get('name'), locale))
  const showMoreNics = nicsToRender.size > 2
  const nicsToShow = nicsToRender.slice(0, 2)
  const additionalNics = nicsToRender.slice(2)

  return <Popover
    id={id}
    title={
      <div>
        {snapshot.get('description')}
        <button
          id={`${id}-close`}
          type='button'
          className='close'
          aria-label='Close'
          onClick={() => document.body.click()} // Hackish way to hide popover, but better solution then create own version of OverlayTrigger or using refs with private methods
        >
          <span aria-hidden='true'>&times;</span>
        </button>
      </div>
    }
    bsClass={`${style['popover']} popover`}
    {...otherProps}
  >
    <div className={style['snapshot-detail-container']}>
      <dl className={style['snapshot-properties']}>
        <dt>
          {msg.created()}
        </dt>
        <dd id={`${id}-created`}>
          {`${time.time} ${time.date}`}
        </dd>
        <dt>
          {msg.operatingSystem()}
        </dt>
        <dd id={`${id}-os`}>
          {getOsHumanName(snapshot.getIn(['vm', 'os', 'type']))}
        </dd>
        <dt>
          {msg.memory()}
        </dt>
        <dd id={`${id}-memory`}>
          {userFormatOfBytes(snapshot.getIn(['vm', 'memory', 'total'])).str} {snapshotMemoryState}
        </dd>
        <dt>
          {msg.cpus()}
        </dt>
        <dd id={`${id}-cpus`}>
          {snapshot.getIn(['vm', 'cpu', 'vCPUs'])}
        </dd>
        <dt>
          {msg.status()}
        </dt>
        <dd id={`${id}-status`}>
          {statusMap(msg)[snapshot.get('status')]}
        </dd>
      </dl>
      <dl className={style['snapshot-properties']}>
        <dt>
          {msg.template()}
        </dt>
        <dd id={`${id}-template`}>
          {template && templateNameRenderer(template)}
        </dd>
        <dt>
          {msg.cdromBoot()}
        </dt>
        <dd id={`${id}-cdrom`}>
          {snapshot.getIn(['vm', 'cdrom', 'file', 'id']) ? snapshot.getIn(['cdrom', 'file', 'id']) : msg.empty() }
        </dd>
        <dt>
          {msg.nic()}
        </dt>
        <dd id={`${id}-nics`}>
          { nicsToRender.size === 0 &&
            <div className={style['no-nics']} id={`${id}-no-nics`}>{msg.noNics()}</div>
          }
          { nicsToRender.size > 0 &&
          <div className={style['snapshot-disk-list']}>
            {nicsToShow && nicsToShow.map(nicRender.bind(null, `${id}-nics`))}
            {
              showMoreNics &&
              <OverlayTrigger
                overlay={<Tooltip id={`snapshot-nic-tooltip-${snapshot.get('id')}`}>
                  {
                    additionalNics && additionalNics.map(nicRender.bind(null, `${id}-nics`))
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
          }
        </dd>
        <dt>
          {msg.bootMenu()}
        </dt>
        <dd id={`${id}-boot-menu`}>
          <Status msg={msg} status={snapshot.getIn(['vm', 'bootMenuEnabled'])} />
        </dd>
        <dt>
          {msg.disks()}
        </dt>
        <dd id={`${id}-disks`}>
          { disksToRender.size === 0 &&
            <div className={style['no-disks']} id={`${id}-no-disks`}>{msg.noDisks()}</div>
          }
          { disksToRender.size > 0 &&
          <div className={style['snapshot-disk-list']}>
            {diskToShow && diskToShow.map(diskRender.bind(null, `${id}-disks`))}
            {
              showMoreDisks &&
              <OverlayTrigger
                overlay={<Tooltip id={`snapshot-disk-tooltip-${snapshot.get('id')}`}>
                  {
                    additionalDisk && additionalDisk.map(diskRender.bind(null, `${id}-disks`))
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
          }
        </dd>
      </dl>
    </div>
    <div style={{ textAlign: 'left' }}>
      <RestoreConfirmationModal
        id={`${id}-restore-modal`}
        snapshot={snapshot}
        vmId={vmId}
        msg={msg}
        trigger={({ onClick }) =>
          isPoolVm ? (
            <OverlayTrigger placement='top' overlay={<Tooltip id={`${id}-restore-tt`}>{ msg.vmPoolSnapshotRestoreUnavailable() }</Tooltip>}>
              <span>
                <Button bsStyle='default' id={`${id}-restore`} disabled style={{ pointerEvents: 'none' }}>{ msg.snapshotRestore() }</Button>
              </span>
            </OverlayTrigger>
          ) : (
            <Button bsStyle='default' id={`${id}-restore`} onClick={onClick} disabled={restoreDisabled}>
              { msg.snapshotRestore() }
            </Button>
          )
        }
      />
    </div>
  </Popover>
}

SnapshotDetail.propTypes = {
  id: PropTypes.string.isRequired,
  snapshot: PropTypes.object.isRequired,
  vmId: PropTypes.string.isRequired,
  restoreDisabled: PropTypes.bool,
  isPoolVm: PropTypes.bool,
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
}

export default withMsg(SnapshotDetail)
