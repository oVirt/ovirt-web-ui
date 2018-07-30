import React from 'react'
import PropTypes from 'prop-types'

import {
  Popover,
  Icon,
  Button,
} from 'patternfly-react'

import style from '../../style.css'

import { msg } from '../../../../intl'

import Selectors from '../../../../selectors'
import { templateNameRenderer, getFormatedDateTime, userFormatOfBytes } from '../../../../helpers'
import { getOsHumanName } from '../../../utils'

import RestoreConfirmationModal from './RestoreConfirmationModal'

function getStatus (status) {
  return status
    ? <span className={style['status-icon']}><Icon type='pf' name='on-running' className={style['green']} />{msg.on()}</span>
    : <span className={style['status-icon']}><Icon type='pf' name='off' />{msg.off()}</span>
}

const SnapshotDetail = ({ snapshot, vmId, ...otherProps }) => {
  const template = Selectors.getTemplateById(snapshot.getIn(['vm', 'template', 'id']))
  const time = getFormatedDateTime(snapshot.get('date'))

  return <Popover
    id={`snapshot-popover-${snapshot.get('id')}`}
    title={snapshot.get('description')}
    bsClass={`${style['popover']} popover`}
    {...otherProps}
  >
    <div className={style['snapshot-detail-container']}>
      <dl className={style['snapshot-properties']}>
        <dt>
          {msg.creationTime()}
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
          {msg.definedMemory()}
        </dt>
        <dd>
          {userFormatOfBytes(snapshot.getIn(['vm', 'memory', 'total'])).str}
        </dd>
        <dt>
          {msg.cpus()}
        </dt>
        <dd>
          {snapshot.getIn(['vm', 'cpu', 'vCPUs'])}
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
      </dl>
    </div>
    <RestoreConfirmationModal snapshot={snapshot} vmId={vmId}><Button bsStyle='default'>{ msg.restoreSnapshot() }</Button></RestoreConfirmationModal>
  </Popover>
}

SnapshotDetail.propTypes = {
  snapshot: PropTypes.object.isRequired,
  vmId: PropTypes.string.isRequired,
}

export default SnapshotDetail
