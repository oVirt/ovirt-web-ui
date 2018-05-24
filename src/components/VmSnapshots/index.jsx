import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { deleteVmSnapshot, addVmSnapshot } from './actions'
import { Button } from 'patternfly-react'
import DeleteConfirmationModal from '../VmModals/DeleteConfirmationModal'
import { msg } from '../../intl'
import FieldHelp from '../FieldHelp'
import naturalCompare from 'string-natural-compare'
import { PendingTaskTypes } from '../../reducers/pendingTasks'

import VmDetailRow, { ExpandableList } from '../VmDetailRow'
import NewSnapshotModal from './NewSnapshotModal'
import style from './style.css'

const MAX_DESCRIPTION_LENGTH = 100

const getMinimazedString = (str, maxChar) => (
  str.length > maxChar ? `${str.substring(0, maxChar - 3)}...` : str
)

function isSnapshotBeingDeleted (snapshotId, pendingTasks) {
  return !!pendingTasks.find(task => task.type === PendingTaskTypes.SNAPSHOT_REMOVAL && task.snapshotId === snapshotId)
}

class VmSnapshot extends React.Component {
  constructor (props) {
    super(props)
    this.state = { showDeleteModal: false }
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  handleOpenDialog () {
    this.setState({ showDeleteModal: true })
  }

  handleDelete () {
    this.props.onDelete({ snapshotId: this.props.snapshot.get('id') })
    this.handleClose()
  }

  handleClose () {
    this.setState({ showDeleteModal: false })
  }

  render () {
    let { snapshot, showSettings, beingDeleted } = this.props
    const idPrefix = `vmsnapshot-${snapshot.get('id')}`
    const description = snapshot.get('description')
    const snapshotInfoContent = (
      <div id={`${idPrefix}-snapshot-info`}>
        {description}
      </div>
    )

    const text = beingDeleted
      ? (<span className={style['light']} id={`${idPrefix}-snapshot`}>
        <del>{getMinimazedString(description, MAX_DESCRIPTION_LENGTH)}</del>
      </span>)
      : (<span className={style['light']} id={`${idPrefix}-snapshot`}>
        {getMinimazedString(description, MAX_DESCRIPTION_LENGTH)}
      </span>)

    let snapshotMemoryInfo = null
    if (snapshot.get('persistMemoryState')) {
      snapshotMemoryInfo = (
        <span style={{ marginRight: '5px' }}>
          <FieldHelp
            content={msg.isPersistMemorySnapshot()}
            text={<span className='pficon pficon-memory' />}
            container={null} />
        </span>
      )
    }

    return (
      <li>
        <span id={`${idPrefix}`}>
          <span style={{ marginRight: '5px' }}>
            <FieldHelp
              title={msg.description()}
              content={snapshotInfoContent}
              text={text}
              container={null} />
          </span>
          {snapshotMemoryInfo}
          {
            showSettings
            ? (<Button bsStyle='default' bsSize='small' onClick={this.handleOpenDialog}>
              {msg.delete()}
            </Button>)
            : null
          }
          <DeleteConfirmationModal show={this.state.showDeleteModal} onDelete={this.handleDelete} onClose={this.handleClose}>
            <p dangerouslySetInnerHTML={{ __html: msg.areYouSureYouWantToDeleteSnapshot({ snapshotName: `"<strong>${getMinimazedString(description, MAX_DESCRIPTION_LENGTH)}</strong>"` }) }} />
            <p>{msg.thisOperationCantBeUndone()}</p>
          </DeleteConfirmationModal>
        </span>
      </li>
    )
  }
}
VmSnapshot.propTypes = {
  snapshot: PropTypes.object.isRequired,
  showSettings: PropTypes.bool,
  beingDeleted: PropTypes.bool,
  onDelete: PropTypes.func.isRequired,
}

const VmSnapshotConnected = connect(
  (state, { snapshot }) => ({
    beingDeleted: isSnapshotBeingDeleted(snapshot.get('id'), state.pendingTasks),
  }),
  (dispatch) => ({})
)(VmSnapshot)

const VmSnapshots = function ({ snapshots, onSnapshotAdd, enableSettings, onSnapshotDelete }) {
  let renderedSnapshots = snapshots.sort((a, b) => naturalCompare.caseInsensitive(a.get('description'), b.get('description'))).map(snapshot => (
    <VmSnapshotConnected snapshot={snapshot} key={snapshot.get('id')} onDelete={onSnapshotDelete} />
  )).toJS()

  const idPrefix = `vmsnapshots-`

  const snapshotsModal = <NewSnapshotModal onAdd={onSnapshotAdd} />

  return (
    <VmDetailRow
      label={msg.snapshot()}
      labelTooltip={msg.snapshotsTooltip()}
      iconClassname='pficon pficon-blueprint'
      editor={<ExpandableList items={renderedSnapshots} noItemsTitle={msg.noSnapshots()} addItemComponent={snapshotsModal} idPrefix={idPrefix} />}
      enableSettings={enableSettings}
    />
  )
}

VmSnapshots.propTypes = {
  vmId: PropTypes.string.isRequired,
  snapshots: PropTypes.object.isRequired,
  enableSettings: PropTypes.bool,
  onSnapshotAdd: PropTypes.func.isRequired,
  onSnapshotDelete: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({}),

  (dispatch, { vmId }) => ({
    onSnapshotAdd: ({ snapshot }) => dispatch(addVmSnapshot({ vmId, snapshot })),
    onSnapshotDelete: ({ snapshotId }) => dispatch(deleteVmSnapshot({ vmId, snapshotId })),
  })
)(VmSnapshots)
