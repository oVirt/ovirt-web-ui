import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { MsgContext } from '_/intl'
import BaseCard from '../../BaseCard'
import style from './style.css'

import NewSnapshotModal from './NewSnapshotModal'
import SnapshotItem from './SnapshotItem'
import { PendingTaskTypes } from '_/reducers/pendingTasks'

const DOWN_STATUS = 'down'
const RUNNING_STATUS = 'up'

const Snapshots = ({
  snapshots,
  vmId,
  idPrefix,
  beingCreated,
  beingDeleted,
  beingRestored,
  isVmDown,
  canUserManipulateSnapshot,
  isVmRunning,
}) => {
  const isVmInPreview = !!snapshots.find(snapshot => snapshot.get('status') === 'in_preview')
  const isVmLocked = !!snapshots.find(snapshot => snapshot.get('status') === 'locked')
  const isActionDisabled = isVmInPreview || beingCreated || beingRestored || beingDeleted || isVmLocked || !canUserManipulateSnapshot
  return (
    <React.Fragment>
      { canUserManipulateSnapshot && <div className={style['snapshot-create']}>
        <NewSnapshotModal vmId={vmId} disabled={isActionDisabled} idPrefix={`${idPrefix}-new-snapshot`} isVmRunning={isVmRunning} />
      </div> }
      {
        snapshots.sort((a, b) => b.get('date') - a.get('date')).map((snapshot) => (
          <SnapshotItem
            key={snapshot.get('id')}
            id={`${idPrefix}-${snapshot.get('description').replace(/[\s]+/g, '_')}`}
            snapshot={snapshot}
            vmId={vmId}
            isEditing={!isActionDisabled}
            hideActions={!canUserManipulateSnapshot}
            isVmDown={isVmDown}
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
  isVmDown: PropTypes.bool,
  isVmRunning: PropTypes.bool,
  canUserManipulateSnapshot: PropTypes.bool,
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
  const { msg } = useContext(MsgContext)
  const snapshots = vm.get('snapshots', []).filter((s) => !s.get('isActive'))
  const idPrefix = 'vmdetail-snapshots'

  return (
    <BaseCard
      icon={{ type: 'pf', name: 'virtual-machine' }}
      title={msg.snapshot()}
      itemCount={snapshots.size}
      idPrefix={idPrefix}
      editable={false}
    >
      <ConnectedSnapshots
        snapshots={snapshots}
        vmId={vm.get('id')}
        canUserManipulateSnapshot={vm.get('canUserManipulateSnapshots')}
        idPrefix={idPrefix}
        isVmDown={vm.get('status') === DOWN_STATUS}
        isVmRunning={vm.get('status') === RUNNING_STATUS}
      />
    </BaseCard>
  )
}
SnapshotsCard.propTypes = {
  vm: PropTypes.object.isRequired,
}

export default SnapshotsCard
