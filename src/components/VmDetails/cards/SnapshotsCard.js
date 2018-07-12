import React from 'react'
import PropTypes from 'prop-types'
import {
  Icon,
} from 'patternfly-react'

import BaseCard from '../BaseCard'
import style from '../style.css'

const ViewSnapshotItem = ({ snapshot }) => {
  return (
    <div className={style['snapshot-item-view']}>
      {snapshot.get('description')}
    </div>
  )
}
ViewSnapshotItem.propTypes = {
  snapshot: PropTypes.object.isRequired,
}

const EditSnapshotItem = ({ snapshot }) => {
  const onEdit = (e) => {
    e.preventDefault()
    console.log(`EDIT SNAPSHOT id: ${snapshot.get('id')}`)
  }

  return (
    <div className={style['snapshot-item-edit']}>
      {snapshot.get('description')} <a href='#' onClick={onEdit}><Icon type='pf' name='add-circle-o' /></a>
    </div>
  )
}
EditSnapshotItem.propTypes = {
  snapshot: PropTypes.object.isRequired,
}

/**
 * List of Snapshots taken of a VM
 */
const SnapshotsCard = ({ vm }) => {
  const snapshots = vm.get('snapshots', []) // TODO: sort as necessary

  const onCreateSnapshot = (e) => {
    e.preventDefault()
    console.log(`CREATE SNAPSHOT for vm: ${vm.get('id')}`)
  }

  return (
    <BaseCard
      icon={{ type: 'pf', name: 'virtual-machine' }}
      title='Snapshots'
      editTooltip={`Edit snaphots for ${vm.get('id')}`}
      itemCount={snapshots.size}
      onCancel={() => {}}
      onSave={() => {}}
    >
      {({ isEditing }) => {
        if (isEditing) {
          return (
            <div>
              {snapshots.map((snapshot) => (
                <EditSnapshotItem snapshot={snapshot} key={snapshot.get('id')} />
              ))}
              <div className={style['snapshot-create']}>
                <a href='#' onClick={onCreateSnapshot}>
                  Create Snapshot
                  <Icon type='pf' name='add-circle-o' />
                </a>
              </div>
            </div>
          )
        } else {
          return (
            <div>
              {snapshots.map((snapshot) => (
                <ViewSnapshotItem snapshot={snapshot} key={snapshot.get('id')} />
              ))}
            </div>
          )
        }
      }}
    </BaseCard>
  )
}
SnapshotsCard.propTypes = {
  vm: PropTypes.object.isRequired,
}

export default SnapshotsCard
