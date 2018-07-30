import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import {
  Icon,
  OverlayTrigger,
  Tooltip,
} from 'patternfly-react'

import style from '../../style.css'

import { msg } from '../../../../intl'
import RestoreConfirmationModal from './RestoreConfirmationModal'
import DeleteConfirmationModal from '../../../VmModals/DeleteConfirmationModal'
import SnapshotDetail from './SnapshotDetail'
import { deleteVmSnapshot } from './actions'
import { formatDateFromNow } from '../../../../helpers'
import { PendingTaskTypes } from '../../../../reducers/pendingTasks'

const StatusTooltip = ({ icon, text, id }) => {
  return <OverlayTrigger overlay={<Tooltip id={id}>{text}</Tooltip>} placement='left' trigger={['hover', 'focus']}>
    <a>{icon}</a>
  </OverlayTrigger>
}

StatusTooltip.propTypes = {
  icon: PropTypes.node.isRequired,
  text: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
}

function isSnapshotBeingDeleted (snapshotId, pendingTasks) {
  return !!pendingTasks.find(task => task.type === PendingTaskTypes.SNAPSHOT_REMOVAL && task.snapshotId === snapshotId)
}

const SnapshotItem = ({ snapshot, vmId, isEditing, beingDeleted, onSnapshotDelete }) => {
  let buttons = []
  let statusIcon = null
  if (!snapshot.get('isActive')) {
    buttons.push(<OverlayTrigger
      overlay={<SnapshotDetail key='detail' snapshot={snapshot} vmId={vmId} />}
      placement='left'
      trigger='click'
      rootClose
      key='info'
    >
      <a><Icon type='pf' name='info' /></a>
    </OverlayTrigger>)
    if (isEditing && !snapshot.get('isActive') && !beingDeleted) {
      buttons.push(<RestoreConfirmationModal key='restore' snapshot={snapshot} vmId={vmId} />)
      buttons.push(<DeleteConfirmationModal key='delete' trigger={<a key='delete'><Icon type='pf' name='delete' /></a>} onDelete={onSnapshotDelete}>
        <span dangerouslySetInnerHTML={{ __html: msg.areYouSureYouWantToDeleteSnapshot({ snapshotName: `"<strong>${snapshot.get('description')}</strong>"` }) }} />
        <br />
        <span>{msg.thisOperationCantBeUndone()}</span>
      </DeleteConfirmationModal>)
    }
    const tooltipId = `${snapshot.get('id')}_${snapshot.get('status')}`
    switch (snapshot.get('status')) {
      case 'locked':
        statusIcon = <StatusTooltip icon={<Icon type='pf' name='locked' />} text={msg.locked()} id={tooltipId} />
        break
      case 'in_preview':
        statusIcon = <StatusTooltip icon={<Icon type='fa' name='eye' />} text={msg.inPreview()} id={tooltipId} />
        break
      case 'ok':
        statusIcon = <StatusTooltip icon={<Icon type='pf' name='ok' />} text={msg.ok()} id={tooltipId} />
        break
    }
  }
  return (
    <div className={style['snapshot-item']}>
      {statusIcon} {snapshot.get('description')}
      <span className={style['snapshot-time']}>{`(${formatDateFromNow(snapshot.get('date'))})`}</span>
      <span className={style['snapshot-item-actions']}>{ buttons }</span>
    </div>
  )
}

SnapshotItem.propTypes = {
  snapshot: PropTypes.object.isRequired,
  vmId: PropTypes.string.isRequired,
  isEditing: PropTypes.bool,
  beingDeleted: PropTypes.bool,
  onSnapshotDelete: PropTypes.func.isRequired,
}

export default connect(
  (state, { snapshot }) => ({
    beingDeleted: isSnapshotBeingDeleted(snapshot.get('id'), state.pendingTasks),
  }),
  (dispatch, { vmId, snapshot }) => ({
    onSnapshotDelete: () => dispatch(deleteVmSnapshot({ vmId, snapshotId: snapshot.get('id') })),
  })
)(SnapshotItem)
