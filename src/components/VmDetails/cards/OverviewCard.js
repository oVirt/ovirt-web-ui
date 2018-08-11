import React from 'react'
import PropTypes from 'prop-types'

import { Checkbox } from 'patternfly-react'
import BaseCard from '../BaseCard'
import style from '../style.css'

/**
 * Overview of the VM (icon, OS type, name, state, description)
 */
const OverviewCard = ({ vm, onEditChange }) => {
  const handleCheckbox = (e) => {
    onEditChange(true, e.target.checked)
  }

  return (
    <BaseCard
      editTooltip={`Edit overview for ${vm.get('id')}`}
      onStartEdit={() => { onEditChange(true) }}
      onCancel={() => { onEditChange(false) }}
      onSave={() => { onEditChange(false) }}
    >
      {({ isEditing }) => {
        return (
          <div>
            <p className={style['demo-text']} style={{ marginRight: '25px' }}>
              Overview content for {vm.get('name')} <br />
            </p>

            {isEditing && (
              <div>
                <p className={style['demo-text']}>EDITING 1</p>
                <Checkbox onChange={handleCheckbox}>Check to mark the edit dirty.</Checkbox>
              </div>
            )}
          </div>
        )
      }}
    </BaseCard>
  )
}
OverviewCard.propTypes = {
  vm: PropTypes.object.isRequired,
  onEditChange: PropTypes.func.isRequired,
}

export default OverviewCard
