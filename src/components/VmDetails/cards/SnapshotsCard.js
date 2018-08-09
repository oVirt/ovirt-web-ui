import React from 'react'
import PropTypes from 'prop-types'

import BaseCard from '../BaseCard'
import style from '../style.css'

/**
 * List of Snapshots taken of a VM
 */
const SnapshotsCard = ({ vm, onEditChange }) => {
  const snapshots = vm.get('snapshots', []) // TODO: sort as necessary

  return (
    <BaseCard
      icon={{ type: 'pf', name: 'virtual-machine' }}
      title='Snapshots'
      editTooltip={`Edit snaphots for ${vm.get('id')}`}
      itemCount={snapshots.size}
      onStartEdit={() => { onEditChange(true) }}
      onCancel={() => { onEditChange(false) }}
      onSave={() => { onEditChange(false) }}
    >
      {({ isEditing }) => {
        if (isEditing) {
          return (
            <div>
              <p className={style['demo-text']}>Snapshots for {vm.get('name')}</p>
              <p className={style['demo-text']}>EDITING</p>
            </div>
          )
        } else {
          return (
            <div>
              <p className={style['demo-text']}>Snapshots for {vm.get('name')}</p>
            </div>
          )
        }
      }}
    </BaseCard>
  )
}
SnapshotsCard.propTypes = {
  vm: PropTypes.object.isRequired,
  onEditChange: PropTypes.func.isRequired,
}

export default SnapshotsCard
