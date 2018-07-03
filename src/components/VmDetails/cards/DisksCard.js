import React from 'react'
import PropTypes from 'prop-types'

import BaseCard from '../BaseCard'
import style from '../style.css'

/**
 * List of disks attached a VM
 */
const DisksCard = ({ vm }) => {
  return (
    <BaseCard
      icon={{ type: 'pf', name: 'storage-domain' }}
      title='Disks'
      editTooltip={`Edit Disks for ${vm.get('id')}`}
      itemCount={vm.get('disks').size}
      onCancel={() => {}}
      onSave={() => {}}
    >
      {({ isEditing }) => {
        return (
          <div>
            <p className={style['demo-text']}>
              Disks for {vm.get('name')}
            </p>

            {isEditing && (
              <p className={style['demo-text']}>EDITING</p>
            )}
          </div>
        )
      }}
    </BaseCard>
  )
}
DisksCard.propTypes = {
  vm: PropTypes.object,
}

export default DisksCard
