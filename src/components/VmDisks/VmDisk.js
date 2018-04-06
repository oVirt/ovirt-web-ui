import React from 'react'
import { userFormatOfBytes } from 'ovirt-ui-components'
import PropTypes from 'prop-types'
import { Modal } from 'patternfly-react'
import { connect } from 'react-redux'

import FieldHelp from '../FieldHelp/index'
import { msg } from '../../intl'
import { removeDisk } from './actions'
import style from './style.css'
import { PendingTaskTypes } from '../../reducers/pendingTasks'

class VmDisk extends React.PureComponent {

  constructor (props) {
    super(props)
    this.state = { showConfirmDeleteDialog: false }
    this.onDeleteButton = this.onDeleteButton.bind(this)
    this.onConfirmDeleteButton = this.onConfirmDeleteButton.bind(this)
    this.onCloseConfirmDeleteDialog = this.onCloseConfirmDeleteDialog.bind(this)
  }

  onDeleteButton () {
    this.setState({ showConfirmDeleteDialog: true })
  }

  onConfirmDeleteButton () {
    this.setState({ showConfirmDeleteDialog: false })
    this.props.removeFunction(this.props.disk.get('id'))
  }

  onCloseConfirmDeleteDialog () {
    this.setState({ showConfirmDeleteDialog: false })
  }

  render () {
    const idPrefix = `vmdisk-${this.props.disk.get('name')}`
    const bootable = this.props.disk.get('bootable') ? (<span className={'label label-info ' + style['smaller']} id={`${idPrefix}-bootable`}>Bootable</span>) : ''
    const inactive = this.props.disk.get('active') ? '' : (<span className={'label label-info ' + style['smaller']} id={`${idPrefix}-inactive`}>Inactive</span>)

    const provSize = userFormatOfBytes(this.props.disk.get('provisionedSize'))
    const actSize = userFormatOfBytes(this.props.disk.get('actualSize'), provSize.suffix)

    const capacityInfoContent = (
      <div id={`${idPrefix}-capacity-info`}>
        Used: {actSize.str}
        <br />
        Total: {provSize.str}
      </div>
    )

    const text = (
      <span className={style['light']} id={`${idPrefix}-capacity`}>
        ({actSize.rounded}/{provSize.str} used)
      </span>
    )

    const capacityInfo = (<FieldHelp
      title={msg.diskCapacity()}
      content={capacityInfoContent}
      text={text}
      container={null} />)

    const deleteButton = this.props.edit && !this.props.beingDeleted && (
      <button className='btn btn-default' onClick={this.onDeleteButton}>{msg.delete()}</button>
    )

    const deletionConfirmationDialog = (
      <Modal onHide={this.onCloseConfirmDeleteDialog} show={this.state.showConfirmDeleteDialog}>
        <Modal.Header>
          <button
            className='close'
            onClick={this.onCloseConfirmDeleteDialog}
          >
            <span className='pficon pficon-close' title={msg.close()} />
          </button>
          <Modal.Title>{msg.confirmDelete()}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p dangerouslySetInnerHTML={{ __html: msg.areYouSureYouWantToDeleteDisk({ diskName: `"<strong>${this.props.disk.get('name')}</strong>"` }) }} />
          <p>{msg.thisOperationCantBeUndone()}</p>
        </Modal.Body>
        <Modal.Footer>
          <button className='btn btn-default' onClick={this.onCloseConfirmDeleteDialog}>{msg.cancel()}</button>
          <button className='btn btn-danger' onClick={this.onConfirmDeleteButton}>{msg.delete()}</button>
        </Modal.Footer>
      </Modal>
    )

    const name = this.props.beingDeleted
      ? (<del>{this.props.disk.get('name')}</del>)
      : this.props.disk.get('name')

    return (
      <li>
        <span id={`${idPrefix}`} className={style['vmdisk-item']}>
          <span className={style['vmdisk-item-info']}>
            {name}
            &nbsp;
            {capacityInfo}
            {bootable}
            {inactive}
          </span>
          <span className={style['vmdisk-item-delete']}>
            {deleteButton}
          </span>
          {deletionConfirmationDialog}
        </span>
      </li>
    )
  }
}

VmDisk.propTypes = {
  disk: PropTypes.object.isRequired,
  edit: PropTypes.bool.isRequired,
  beingDeleted: PropTypes.bool.isRequired,
  removeFunction: PropTypes.func.isRequired,  // (diskId: string) => any,
}

function isDiskBeingDeleted (diskId, pendingTasks) {
  return !!pendingTasks.find(task => task.type === PendingTaskTypes.DISK_REMOVAL && task.diskId === diskId)
}

const VmDiskConnected = connect(
  (state, { disk }) => ({
    beingDeleted: isDiskBeingDeleted(disk.get('id'), state.pendingTasks),
  }),
  (dispatch, { vmId }) => ({
    removeFunction: (diskId) => dispatch(removeDisk(diskId, vmId)),
  })
)(VmDisk)

VmDiskConnected.propTypes = {
  disk: PropTypes.object.isRequired, // deep immutable.js
  edit: PropTypes.bool.isRequired,
  vmId: PropTypes.string.isRequired,
}

export default VmDiskConnected
