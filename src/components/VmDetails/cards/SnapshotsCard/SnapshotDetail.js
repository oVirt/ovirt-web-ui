import React from 'react'
import PropTypes from 'prop-types'

import {
  Label,
  LabelGroup,
  Popover,
} from '@patternfly/react-core'
import Immutable from 'immutable'

import style from './style.css'

import { withMsg } from '_/intl'

import Selectors from '_/selectors'
import { templateNameRenderer, getFormatedDateTime, userFormatOfBytes, localeCompare } from '_/helpers'
import { getOsHumanName, sortDisksForDisplay } from '_/components/utils'

import { OffIcon, RunningIcon } from '@patternfly/react-icons/dist/esm/icons'
const Status = ({ status, msg }) => {
  return status
    ? <span className={style['status-icon']}><RunningIcon className={style.green} />{msg.on()}</span>
    : <span className={style['status-icon']}><OffIcon/>{msg.off()}</span>
}

Status.propTypes = {
  status: PropTypes.bool.isRequired,
  msg: PropTypes.object.isRequired,
}

const diskRender = (idPrefix, disk, index) => {
  const provSize = userFormatOfBytes(disk.get('provisionedSize'))
  const actSize = userFormatOfBytes(disk.get('actualSize'), provSize.suffix)
  return (
    <Label key={disk.get('id')} id={`${idPrefix}-${disk.get('name')}-${index}`}>
      {`${disk.get('name')} (${actSize.str} used / ${provSize.str})`}
    </Label>
  )
}

const nicRender = (idPrefix, nic) => {
  return (
    <Label key={nic.get('id')} id={`${idPrefix}-${nic.get('name')}`}>
      {nic.get('name')}
    </Label>
  )
}

const statusMap = (msg) => ({
  in_preview: msg.inPreview(),
  locked: msg.locked(),
  ok: msg.ok(),
})

const SnapshotDetail = ({ snapshot, vmId, id, isPoolVm, msg, locale, position, children }) => {
  const template = Selectors.getTemplateById(snapshot.getIn(['vm', 'template', 'id']))
  const time = getFormatedDateTime(snapshot.get('date'))

  const snapshotMemoryState = snapshot.get('persistMemoryState') && msg.memoryIncluded()

  const disksToRender = sortDisksForDisplay(snapshot.get('disks', Immutable.fromJS([])), locale)

  const nicsToRender = snapshot.get('nics', Immutable.fromJS([])).sort((a, b) => localeCompare(a.get('name'), b.get('name'), locale))

  return (
    <Popover
      id={id}
      position={position}
      headerContent={snapshot.get('description')}
      hasAutoWidth
      bodyContent={(
        <>
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
                { nicsToRender.size > 0 && (
                  <LabelGroup isVertical numLabels={2}>
                    {nicsToRender.map(nicRender.bind(null, `${id}-nics`))}
                  </LabelGroup>
                )}
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
                { disksToRender.size === 0 && <div className={style['no-disks']} id={`${id}-no-disks`}>{msg.noDisks()}</div> }
                { disksToRender.size > 0 && (
                  <LabelGroup isVertical numLabels={2}>
                    {disksToRender.map(diskRender.bind(null, `${id}-disks`))}
                  </LabelGroup>
                )}
              </dd>
            </dl>
          </div>
        </>
      )}
    >
      {children}
    </Popover>
  )
}

SnapshotDetail.propTypes = {
  id: PropTypes.string.isRequired,
  snapshot: PropTypes.object.isRequired,
  vmId: PropTypes.string.isRequired,
  isPoolVm: PropTypes.bool,
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
  position: PropTypes.oneOf(['auto', 'top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end', 'left-start', 'left-end', 'right-start', 'right-end']),
  children: PropTypes.object,
}

export default withMsg(SnapshotDetail)
