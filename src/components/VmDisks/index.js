import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { userFormatOfBytes } from 'ovirt-ui-components'

import FieldHelp from '../FieldHelp/index'

import style from './style.css'

const VmDisk = ({ disk }) => {
  const idPrefix = `vmdisk-${disk.get('name')}`
  const bootable = disk.get('bootable') ? (<span className={'label label-info ' + style['smaller']} id={`${idPrefix}-bootable`}>Bootable</span>) : ''
  const inactive = disk.get('active') ? '' : (<span className={'label label-info ' + style['smaller']} id={`${idPrefix}-inactive`}>Inactive</span>)

  const provSize = userFormatOfBytes(disk.get('provisionedSize'))
  const actSize = userFormatOfBytes(disk.get('actualSize'), provSize.suffix)

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
    </span>)

  const capacityInfo = (<FieldHelp
    title='Disk Capacity'
    content={capacityInfoContent}
    text={text}
    container={null} />)

  return (
    <li>
      <span id={`${idPrefix}`}>
        {disk.get('name')}&nbsp;
        {capacityInfo}
        {bootable}
        {inactive}
      </span>
    </li>
  )
}
VmDisk.propTypes = {
  disk: PropTypes.object.isRequired,
}

class VmDisks extends Component {
  constructor (props) {
    super(props)
    this.state = {
      renderMore: false,
    }
  }

  render () {
    const { disks,
      } = this.props

    if (!disks || disks.isEmpty()) {
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
          less
        </div>
      )
    } else {
      const hiddenCount = disks.size - 2
      if (hiddenCount > 0) {
        moreButton = (
          <div className={style['button-more']} onClick={() => this.setState({ renderMore: true })} id={`${idPrefix}-button-more`}>
            more ({hiddenCount})
          </div>
        )
      }
    }

    return (
      <div className={classes}>
        <ul className={style['disks-ul']}>
          {disksToRender.map(disk => <VmDisk disk={disk} key={disk.get('id')} />)}
        </ul>
        {moreButton}
      </div>
    )
  }
}
VmDisks.propTypes = {
  disks: PropTypes.object, // deep immutable.js array
}

export default VmDisks
