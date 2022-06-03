import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { MsgContext, withMsg } from '_/intl'
import { PendingTaskTypes } from '_/reducers/pendingTasks'

import style from './style.css'
import itemStyle from '../../itemListStyle.css'

import BaseCard from '../../BaseCard'
import NewSnapshotModal from './NewSnapshotModal'
import SnapshotItem from './SnapshotItem'
import { VirtualMachineIcon } from '@patternfly/react-icons/dist/esm/icons'
import { Grid, Row, Col } from '_/components/Grid'

const DOWN_STATUS = 'down'
const RUNNING_STATUS = 'up'

const Snapshots = ({
  snapshots,
  vmId,
  idPrefix,
  beingCreated,
  beingDeleted,
  beingRestored,
  isVmDown,
  canUserManipulateSnapshot,
  isVmRunning,
  msg,
}) => {
  const isVmInPreview = !!snapshots.find(snapshot => snapshot.get('status') === 'in_preview')
  const isVmLocked = !!snapshots.find(snapshot => snapshot.get('status') === 'locked')
  const isActionDisabled = isVmInPreview || beingCreated || beingRestored || beingDeleted || isVmLocked || !canUserManipulateSnapshot
  return (
    <Grid className={style['snapshot-container']}>
      { canUserManipulateSnapshot && (
        <Row key={`${idPrefix}-snapshot-add`}>
          <Col>
            <NewSnapshotModal vmId={vmId} disabled={isActionDisabled} idPrefix={`${idPrefix}-new-snapshot`} isVmRunning={isVmRunning} />
          </Col>
        </Row>
      ) }

      { snapshots.size === 0 && (
        <Row key={`${idPrefix}-no-snapshot`}>
          <Col>
            <div className={itemStyle['no-items']} id={`${idPrefix}-no-snapshots`}>{msg.noSnapshots()}</div>
          </Col>
        </Row>
      )}

      { snapshots.size > 0 && snapshots.sort((a, b) => b.get('date') - a.get('date')).map((snapshot) => (
        <Row key={`${idPrefix}-${snapshot.get('description').replace(/[\s]+/g, '_')}`}>
          <Col style={{ display: 'block' }}>
            <SnapshotItem
              key={snapshot.get('id')}
              id={`${idPrefix}-${snapshot.get('description').replace(/[\s]+/g, '_')}`}
              snapshot={snapshot}
              vmId={vmId}
              isEditing={!isActionDisabled}
              hideActions={!canUserManipulateSnapshot}
              isVmDown={isVmDown}
            />
          </Col>
        </Row>
      ))
      }
    </Grid>
  )
}
Snapshots.propTypes = {
  snapshots: PropTypes.object.isRequired,
  vmId: PropTypes.string.isRequired,
  idPrefix: PropTypes.string.isRequired,
  beingCreated: PropTypes.bool,
  beingRestored: PropTypes.bool,
  beingDeleted: PropTypes.bool,
  isVmDown: PropTypes.bool,
  isVmRunning: PropTypes.bool,
  canUserManipulateSnapshot: PropTypes.bool,
  msg: PropTypes.object.isRequired,
}

const ConnectedSnapshots = connect(
  ({ pendingTasks }, { vmId }) => {
    const vmTasks = pendingTasks.filter(task => task?.vmId === vmId)
    return {
      beingCreated: !!vmTasks.find(task => task.type === PendingTaskTypes.SNAPSHOT_ADD),
      beingRestored: !!vmTasks.find(task => task.type === PendingTaskTypes.SNAPSHOT_RESTORE),
      beingDeleted: !!vmTasks.find(task => task.type === PendingTaskTypes.SNAPSHOT_REMOVAL),
    }
  }
)(withMsg(Snapshots))

/**
 * List of Snapshots taken of a VM
 */
const SnapshotsCard = ({ vm }) => {
  const { msg } = useContext(MsgContext)
  const snapshots = vm.get('snapshots', []).filter((s) => !s.get('isActive'))
  const idPrefix = 'vmdetail-snapshots'

  return (
    <BaseCard
      icon={VirtualMachineIcon}
      title={msg.snapshot()}
      itemCount={snapshots.size}
      idPrefix={idPrefix}
      editable={false}
    >
      <ConnectedSnapshots
        snapshots={snapshots}
        vmId={vm.get('id')}
        canUserManipulateSnapshot={vm.get('canUserManipulateSnapshots')}
        idPrefix={idPrefix}
        isVmDown={vm.get('status') === DOWN_STATUS}
        isVmRunning={vm.get('status') === RUNNING_STATUS}
      />
    </BaseCard>
  )
}
SnapshotsCard.propTypes = {
  vm: PropTypes.object.isRequired,
}

export default SnapshotsCard
