import React from 'react'
import PropTypes from 'prop-types'

import BaseCard from '../BaseCard'
import style from '../style.css'

/**
 * List of Snapshots taken of a VM
 */
const SnapshotsCard = ({ vm }) => {
  return (
    <BaseCard
      icon={{ type: 'pf', name: 'virtual-machine' }}
      title='Snapshots'
      editTooltip={`Edit snaphots for ${vm.get('id')}`}
      itemCount={99}
      onCancel={() => {}}
      onSave={() => {}}
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
              <p>
                Pull request https://github.com/oVirt/ovirt-web-ui/pull/619 will add snapshot
                functionality to the app.  Easiest to get that PR sorted out to leverage it.
              </p>
            </div>
          )
        }
      }}
    </BaseCard>
  )
}
SnapshotsCard.propTypes = {
  vm: PropTypes.object,
}

export default SnapshotsCard
