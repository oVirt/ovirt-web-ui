import React from 'react'
import PropTypes from 'prop-types'

import BaseCard from '../../BaseCard'
import style from './style.css'

import NewSnapshotModal from './NewSnapshotModal'
import SnapshotItem from './SnapshotItem'

const Snapshots = ({ snapshots, vmId }) => {
  const isVmInPreview = !!snapshots.find(snapshot => snapshot.get('status') === 'in_preview')
  return (
    <React.Fragment>
      {
        !isVmInPreview &&
        <div className={style['snapshot-create']}>
          <NewSnapshotModal vmId={vmId} />
        </div>
      }
      {snapshots.sort((a, b) => b.get('date') - a.get('date')).map((snapshot) => (
        <SnapshotItem key={snapshot.get('id')} snapshot={snapshot} vmId={vmId} isEditing={!isVmInPreview} />
      ))}
    </React.Fragment>
  )
}

Snapshots.propTypes = {
  snapshots: PropTypes.object.isRequired,
  vmId: PropTypes.string.isRequired,
}

/**
 * List of Snapshots taken of a VM
 */
const SnapshotsCard = ({ vm }) => {
  const snapshots = vm.get('snapshots', []).filter((s) => !s.get('isActive'))

  return (
    <BaseCard
      icon={{ type: 'pf', name: 'virtual-machine' }}
      title='Snapshots'
      itemCount={snapshots.size}
      editable={false}
    >
      <Snapshots snapshots={snapshots} vmId={vm.get('id')} />
    </BaseCard>
  )
}
SnapshotsCard.propTypes = {
  vm: PropTypes.object.isRequired,
}

export default SnapshotsCard
