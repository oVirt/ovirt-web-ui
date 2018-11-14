import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { msg } from '../../intl'
import VmDisk from './VmDisk'
import style from './style.css'
import NewDiskDialog from '../NewDiskDialog'
import { sortDisksForDisplay } from './utils'

const SHORT_LIST_LENGTH = 2

class VmDisks extends Component {
  constructor (props) {
    super(props)
    this.state = {
      renderMore: false,
      showNewDialog: false,
    }
  }

  render () {
    const { disks, edit, allowDelete, vmId } = this.props

    if (!edit && (!disks || disks.isEmpty())) {
      return null
    }

    let classes = style['disks-list']

    let disksToRender = sortDisksForDisplay(disks)
    if (!this.state.renderMore) {
      disksToRender = disksToRender.slice(0, SHORT_LIST_LENGTH)
    }

    const idPrefix = `vmdisks-`

    const hiddenCount = disks.size - SHORT_LIST_LENGTH
    const moreButton = hiddenCount > 0
      ? (
        this.state.renderMore
          ? (
            <div className={style['button-more']} onClick={() => this.setState({ renderMore: false })} id={`${idPrefix}-button-less`}>
              {msg.less()}
            </div>
          )
          : (
            <div className={style['button-more']} onClick={() => this.setState({ renderMore: true })} id={`${idPrefix}-button-more`}>
              {msg.more()} ({hiddenCount})
            </div>
          )
      )
      : null

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
            edit={edit}
            allowDelete={allowDelete} />)}
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
  allowDelete: PropTypes.bool.isRequired,
}

export default VmDisks
