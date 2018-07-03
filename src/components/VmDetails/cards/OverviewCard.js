import React from 'react'
import PropTypes from 'prop-types'

import BaseCard from '../BaseCard'
import style from '../style.css'

/**
 * Overview of the VM (icon, OS type, name, state, description)
 */
const OverviewCard = ({ vm }) => {
  return (
    <BaseCard
      title='Overview'
      editTooltip={`Edit overview for ${vm.get('id')}`}
      onCancel={() => {}}
      onSave={() => {}}
    >
      {({ isEditing }) => {
        return (
          <div>
            <p className={style['demo-text']}>
              Overview content for {vm.get('name')} <br />
              ... adapt the card from the VM List cards ...
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
OverviewCard.propTypes = {
  vm: PropTypes.object,
}

export default OverviewCard
