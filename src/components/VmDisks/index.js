import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { msg } from '../../intl'
import VmDisk from './VmDisk'
import style from './style.css'
import NewDiskDialog from '../NewDiskDialog'

class VmDisks extends Component {
  constructor (props) {
    super(props)
    this.state = {
      renderMore: false,
      showNewDialog: false,
    }
  }

  render () {
    const { disks, edit, vmId } = this.props

    if (!edit && (!disks || disks.isEmpty())) {
      return null
    }

    let classes = style['disks-list']

    let disksToRender = disks.sort((a, b) => a.get('name').localeCompare(b.get('name')) - (a.get('bootable') ? 1000 : 0))
    if (!this.state.renderMore) {
      disksToRender = disksToRender.slice(0, 2)
    }

    const idPrefix = `vmdisks-`

    let moreButton = null
    if (this.state.renderMore) {
      moreButton = (
        <div className={style['button-more']} onClick={() => this.setState({ renderMore: false })} id={`${idPrefix}-button-less`}>
          {msg.less()}
        </div>
      )
    } else {
      const hiddenCount = disks.size - 2
      if (hiddenCount > 0) {
        moreButton = (
          <div className={style['button-more']} onClick={() => this.setState({ renderMore: true })} id={`${idPrefix}-button-more`}>
            {msg.more()} ({hiddenCount})
          </div>
        )
      }
    }

    const newButton = edit && (
      <button className='btn btn-default' onClick={() => this.setState({ showNewDialog: true })}>{msg.new()}</button>
    )

    const newDialog = this.state.showNewDialog && (
      <NewDiskDialog onClose={() => this.setState({ showNewDialog: false })} vmId={vmId} />
    )

    return (
      <div className={classes}>
        <ul className={style['disks-ul']}>
          {disksToRender.map(disk => <VmDisk
            disk={disk}
            key={disk.get('id')}
            vmId={vmId}
            edit={edit} />)}
        </ul>
        {moreButton}
        {newButton}
        {newDialog}
      </div>
    )
  }
}
VmDisks.propTypes = {
  disks: PropTypes.object, // deep immutable.js array
  vmId: PropTypes.string.isRequired,
  edit: PropTypes.bool.isRequired,
}

export default VmDisks
