import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import BaseCard from '../../BaseCard'
import style from './style.css'

import NewSnapshotModal from './NewSnapshotModal'
import SnapshotItem from './SnapshotItem'
import { PendingTaskTypes } from '../../../../reducers/pendingTasks'

const Snapshots = ({ snapshots, vmId, idPrefix, beingCreated, beingDeleted, beingRestored }) => {
  const isVmInPreview = !!snapshots.find(snapshot => snapshot.get('status') === 'in_preview')
  return (
    <React.Fragment>
      <div className={style['snapshot-create']}>
        <NewSnapshotModal vmId={vmId} disabled={isVmInPreview || beingCreated || beingRestored || beingDeleted} idPrefix={`${idPrefix}-new-snapshot`} />
      </div>
      {
        snapshots.sort((a, b) => b.get('date') - a.get('date')).map((snapshot) => (
          <SnapshotItem
            key={snapshot.get('id')}
            id={`${idPrefix}-${snapshot.get('description').replace(/[\s]+/g, '_')}`}
            snapshot={snapshot}
            vmId={vmId}
            isEditing={!isVmInPreview && !beingRestored && !beingDeleted && !beingCreated}
          />
        ))
      }
    </React.Fragment>
  )
}
Snapshots.propTypes = {
  snapshots: PropTypes.object.isRequired,
  vmId: PropTypes.string.isRequired,
  idPrefix: PropTypes.string.isRequired,
  beingCreated: PropTypes.bool,
  beingRestored: PropTypes.bool,
  beingDeleted: PropTypes.bool,
}

const ConnectedSnapshots = connect(
  (state) => ({
    beingCreated: !!state.pendingTasks.find(t => t.type === PendingTaskTypes.SNAPSHOT_ADD),
    beingRestored: !!state.pendingTasks.find(task => task.type === PendingTaskTypes.SNAPSHOT_RESTORE),
    beingDeleted: !!state.pendingTasks.find(task => task.type === PendingTaskTypes.SNAPSHOT_REMOVAL),
  })
)(Snapshots)

/**
 * List of Snapshots taken of a VM
 */
const SnapshotsCard = ({ vm }) => {
  const snapshots = vm.get('snapshots', []).filter((s) => !s.get('isActive'))
  const idPrefix = 'vmdetail-snapshots'

  return (
    <BaseCard
      icon={{ type: 'pf', name: 'virtual-machine' }}
      title='Snapshots'
      itemCount={snapshots.size}
      idPrefix={idPrefix}
      editable={false}
    >
      <ConnectedSnapshots snapshots={snapshots} vmId={vm.get('id')} idPrefix={idPrefix} />
    </BaseCard>
  )
}
SnapshotsCard.propTypes = {
  vm: PropTypes.object.isRequired,
}

export default SnapshotsCard
