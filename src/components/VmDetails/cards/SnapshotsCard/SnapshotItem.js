import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import {
  Icon,
  OverlayTrigger,
  Tooltip,
  noop,
} from 'patternfly-react'

import style from './style.css'

import { msg } from '../../../../intl'
import RestoreConfirmationModal from './RestoreConfirmationModal'
import DeleteConfirmationModal from '../../../VmModals/DeleteConfirmationModal'
import SnapshotDetail from './SnapshotDetail'
import { deleteVmSnapshot } from './actions'
import { formatDateFromNow } from '../../../../helpers'
import { getMinimizedString, escapeHtml } from '../../../utils'
import { PendingTaskTypes } from '../../../../reducers/pendingTasks'

const MAX_DESCRIPTION_SIZE = 50

const SnapshotAction = ({ children, className, disabled, id, onClick }) => {
  return (
    <a
      id={id}
      onClick={disabled ? noop : onClick}
      className={`${className} ${disabled && 'disabled'}`}
    >
      {children}
    </a>
  )
}
SnapshotAction.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  onClick: PropTypes.func,
}

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

function isSnapshotDeleted (snapshotId, pendingTasks) {
  return !!pendingTasks.find(task => task.type === PendingTaskTypes.SNAPSHOT_REMOVAL && task.snapshotId === snapshotId)
}

const SnapshotItem = ({ snapshot, vmId, isEditing, beingDeleted, onSnapshotDelete }) => {
  const idPrefix = `snapshot-${snapshot.get('id')}`
  let statusIcon = null
  let buttons = []

  // Snapshot actions
  const isActionsDisabled = beingDeleted || !isEditing || snapshot.get('status') === 'locked'
  if (!snapshot.get('isActive')) {
    // Info popover
    buttons.push(<OverlayTrigger
      overlay={
        <SnapshotDetail key='detail' snapshot={snapshot} vmId={vmId} restoreDisabled={isActionsDisabled} />
      }
      placement='left'
      trigger='click'
      rootClose
      key='info'
    >
      <a id={`${idPrefix}-info`}>
        <OverlayTrigger placement='left' overlay={<Tooltip id={`${idPrefix}-info-tt`}>{ msg.details() }</Tooltip>}>
          <Icon type='pf' name='info' />
        </OverlayTrigger>
      </a>
    </OverlayTrigger>)

    // Restore action
    buttons.push(<RestoreConfirmationModal
      key='restore'
      disabled={isActionsDisabled}
      snapshot={snapshot}
      vmId={vmId}
      trigger={
        <SnapshotAction key='restore' id={`${idPrefix}-restore`} >
          <OverlayTrigger placement='left' overlay={<Tooltip id={`${idPrefix}-restore-tt`}>{ msg.snapshotRestore() }</Tooltip>}>
            <Icon type='fa' name='play-circle' />
          </OverlayTrigger>
        </SnapshotAction>
      }
    />)

    // Delete action
    buttons.push(<DeleteConfirmationModal
      key='delete'
      disabled={isActionsDisabled}
      trigger={
        <SnapshotAction key='delete' id={`${idPrefix}-delete`}>
          <OverlayTrigger placement='left' overlay={<Tooltip id={`${idPrefix}-delete-tt`}>{ msg.snapshotDelete() }</Tooltip>}>
            <Icon type='pf' name='delete' />
          </OverlayTrigger>
        </SnapshotAction>
      }
      onDelete={onSnapshotDelete}
    >
      <span
        dangerouslySetInnerHTML={{
          __html: msg.areYouSureYouWantToDeleteSnapshot({
            snapshotName: `"<strong>${escapeHtml(snapshot.get('description'))}</strong>"`,
          }),
        }}
      />
      <br />
      <span>{msg.thisOperationCantBeUndone()}</span>
    </DeleteConfirmationModal>)

    // Status tooltip
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
      {statusIcon}
      {getMinimizedString(snapshot.get('description'), MAX_DESCRIPTION_SIZE)}
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
    beingDeleted: isSnapshotDeleted(snapshot.get('id'), state.pendingTasks),
  }),
  (dispatch, { vmId, snapshot }) => ({
    onSnapshotDelete: () => dispatch(deleteVmSnapshot({ vmId, snapshotId: snapshot.get('id') })),
  })
)(SnapshotItem)
