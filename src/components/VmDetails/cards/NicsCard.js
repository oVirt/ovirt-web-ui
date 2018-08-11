import React from 'react'
import PropTypes from 'prop-types'

import BaseCard from '../BaseCard'
import style from '../style.css'

/**
 * List of NICs connected to a VM
 */
const NicsCard = ({ vm, onEditChange }) => {
  return (
    <BaseCard
      icon={{ type: 'pf', name: 'network' }}
      title='Network Interfaces'
      editTooltip={`Edit NICs for ${vm.get('id')}`}
      itemCount={vm.get('nics').size}
      onStartEdit={() => { onEditChange(true) }}
      onCancel={() => { onEditChange(false) }}
      onSave={() => { onEditChange(false) }}
    >
      {({ isEditing }) => {
        return (
          <div>
            <p className={style['demo-text']}>
              NICs for {vm.get('name')}
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
NicsCard.propTypes = {
  vm: PropTypes.object.isRequired,
  onEditChange: PropTypes.func.isRequired,
}

export default NicsCard
