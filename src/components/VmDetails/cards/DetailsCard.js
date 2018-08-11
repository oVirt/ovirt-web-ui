import React from 'react'
import PropTypes from 'prop-types'

import BaseCard from '../BaseCard'
import style from '../style.css'

/**
 * Specific information and details of the VM (status, uptime, IP, FQDN
 * host, cluster, data center, template, CD, ??could-init??
 */
const DetailsCard = ({ vm, onEditChange }) => {
  return (
    <BaseCard
      title='Details'
      editTooltip={`Edit details for ${vm.get('id')}`}
      onStartEdit={() => { onEditChange(true) }}
      onCancel={() => { onEditChange(false) }}
      onSave={() => { onEditChange(false) }}
    >
      {({ isEditing }) => {
        return (
          <div>
            <p className={style['demo-text']}>Details details of {vm.get('name')}</p>

            {isEditing && (
              <p className={style['demo-text']}>EDITING</p>
            )}
          </div>
        )
      }}
    </BaseCard>
  )
}
DetailsCard.propTypes = {
  vm: PropTypes.object.isRequired,
  onEditChange: PropTypes.func.isRequired,
}

export default DetailsCard
