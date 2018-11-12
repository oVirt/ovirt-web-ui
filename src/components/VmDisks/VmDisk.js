import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Modal } from 'patternfly-react'

import { userFormatOfBytes } from 'app-helpers'
import { removeDisk } from '_/actions'

import FieldHelp from '../FieldHelp/index'
import { msg } from 'app-intl'
import style from './style.css'
import { PendingTaskTypes } from 'app-reducers/pendingTasks'

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
    const { disk, edit, allowDelete, beingDeleted } = this.props

    const idPrefix = `vmdisk-${disk.get('name')}`
    const bootable = disk.get('bootable') ? (<span className={'label label-info ' + style['smaller']} id={`${idPrefix}-bootable`}>Bootable</span>) : ''
    const inactive = disk.get('active') ? '' : (<span className={'label label-info ' + style['smaller']} id={`${idPrefix}-inactive`}>Inactive</span>)

    const isLun = disk.get('type') === 'lun'
    const lunSize = userFormatOfBytes(disk.get('lunSize'))
    const provSize = userFormatOfBytes(disk.get('provisionedSize'))
    const actSize = userFormatOfBytes(disk.get('actualSize'), provSize.suffix)

    const capacityInfoContent = isLun ? (
      <div id={`${idPrefix}-capacity-info`}>
        Size: {lunSize.str}
      </div>
    ) : (
      <div id={`${idPrefix}-capacity-info`}>
        Used: {actSize.str}
        <br />
        Total: {provSize.str}
      </div>
    )

    const text = isLun ? (
      <span className={style['light']} id={`${idPrefix}-capacity`}>
        ({lunSize.str})
      </span>
    ) : (
      <span className={style['light']} id={`${idPrefix}-capacity`}>
        ({actSize.rounded}/{provSize.str} used)
      </span>
    )

    const capacityInfo = <FieldHelp
      title={msg.diskCapacity()}
      content={capacityInfoContent}
      text={text}
      container={null}
    />

    const deleteButton = edit && allowDelete && !beingDeleted && (
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
          <p dangerouslySetInnerHTML={{ __html: msg.areYouSureYouWantToDeleteDisk({ diskName: `"<strong>${disk.get('name')}</strong>"` }) }} />
          <p>{msg.thisOperationCantBeUndone()}</p>
        </Modal.Body>
        <Modal.Footer>
          <button className='btn btn-default' onClick={this.onCloseConfirmDeleteDialog}>{msg.cancel()}</button>
          <button className='btn btn-danger' onClick={this.onConfirmDeleteButton}>{msg.delete()}</button>
        </Modal.Footer>
      </Modal>
    )

    const name = beingDeleted ? (<del>{disk.get('name')}</del>) : disk.get('name')

    return (
      <li>
        <span className={style['vmdisk-item-info']} id={`${idPrefix}`}>
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
      </li>
    )
  }
}

VmDisk.propTypes = {
  disk: PropTypes.object.isRequired,
  edit: PropTypes.bool.isRequired,
  allowDelete: PropTypes.bool.isRequired,
  beingDeleted: PropTypes.bool.isRequired,
  removeFunction: PropTypes.func.isRequired, // (diskId: string) => any,
}

function isDiskBeingDeleted (diskId, pendingTasks) {
  return !!pendingTasks.find(task => task.type === PendingTaskTypes.DISK_REMOVAL && task.diskId === diskId)
}

export default connect(
  (state, { disk }) => ({
    beingDeleted: isDiskBeingDeleted(disk.get('id'), state.pendingTasks),
  }),
  (dispatch, { vmId }) => ({
    removeFunction: (diskId) => dispatch(removeDisk({ diskId, vmToRefreshId: vmId })),
  })
)(VmDisk)
