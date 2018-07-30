import React from 'react'
import PropTypes from 'prop-types'

import BaseCard from '../../BaseCard'
import style from '../../style.css'

import NewSnapshotModal from './NewSnapshotModal'
import SnapshotItem from './SnapshotItem'

const Snapshots = ({ isEditing, snapshots, vmId }) => {
  return (
    <div>
      {snapshots.map((snapshot) => (
        <SnapshotItem key={snapshot.get('id')} snapshot={snapshot} vmId={vmId} isEditing={isEditing} />
      ))}
      {
        isEditing &&
        <div className={style['snapshot-create']}>
          <NewSnapshotModal vmId={vmId} />
        </div>
      }
    </div>
  )
}

Snapshots.propTypes = {
  snapshots: PropTypes.object.isRequired,
  isEditing: PropTypes.bool,
  vmId: PropTypes.string.isRequired,
}

/**
 * List of Snapshots taken of a VM
 */
const SnapshotsCard = ({ vm }) => {
  const snapshots = vm.get('snapshots', []) // TODO: sort as necessary

  return (
    <BaseCard
      icon={{ type: 'pf', name: 'virtual-machine' }}
      title='Snapshots'
      editTooltip={`Edit snaphots for ${vm.get('id')}`}
      itemCount={snapshots.size}
      onCancel={() => {}}
      onSave={() => {}}
    >
      <Snapshots snapshots={snapshots} vmId={vm.get('id')} />
    </BaseCard>
  )
}
SnapshotsCard.propTypes = {
  vm: PropTypes.object.isRequired,
}

export default SnapshotsCard
