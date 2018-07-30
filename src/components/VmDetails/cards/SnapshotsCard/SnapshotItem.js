import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import {
  Icon,
  OverlayTrigger,
} from 'patternfly-react'

import style from '../../style.css'

import { msg } from '../../../../intl'
import RestoreConfirmationModal from './RestoreConfirmationModal'
import DeleteConfirmationModal from '../../../VmModals/DeleteConfirmationModal'
import SnapshotDetail from './SnapshotDetail'
import { deleteVmSnapshot } from './actions'

const SnapshotItem = ({ snapshot, vmId, isEditing, onSnapshotDelete }) => {
  let buttons = []
  if (!snapshot.get('isActive')) {
    buttons.push(<OverlayTrigger
      overlay={<SnapshotDetail snapshot={snapshot} vmId={vmId} />}
      placement='left'
      trigger='click'
      rootClose
      key='info'
    >
      <a><Icon type='pf' name='info' /></a>
    </OverlayTrigger>)
    if (isEditing && !snapshot.get('isActive')) {
      buttons.push(<RestoreConfirmationModal snapshot={snapshot} vmId={vmId} />)
      buttons.push(<DeleteConfirmationModal trigger={<a key='delete'><Icon type='pf' name='delete' /></a>} onDelete={onSnapshotDelete}>
        <p dangerouslySetInnerHTML={{ __html: msg.areYouSureYouWantToDeleteSnapshot({ snapshotName: `"<strong>${snapshot.get('description')}</strong>"` }) }} />
        <p>{msg.thisOperationCantBeUndone()}</p>
      </DeleteConfirmationModal>)
    }
  }
  return (
    <div className={style['snapshot-item']}>
      {snapshot.get('description')} <span>{ buttons }</span>
    </div>
  )
}

SnapshotItem.propTypes = {
  snapshot: PropTypes.object.isRequired,
  vmId: PropTypes.string.isRequired,
  isEditing: PropTypes.bool,
  onSnapshotDelete: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({}),
  (dispatch, { vmId, snapshot }) => ({
    onSnapshotDelete: () => dispatch(deleteVmSnapshot({ vmId, snapshotId: snapshot.get('id') })),
  })
)(SnapshotItem)
