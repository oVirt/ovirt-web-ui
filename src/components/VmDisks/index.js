import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { userFormatOfBytes } from 'ovirt-ui-components'

import FieldHelp from '../FieldHelp/index'

import style from './style.css'

const VmDisk = ({ disk }) => {
  const bootable = disk.get('bootable') ? (<span className={'label label-info ' + style['smaller']}>Bootable</span>) : ''
  const inactive = disk.get('active') ? '' : (<span className={'label label-default' + style['smaller']}>Inactive</span>)

  const provSize = userFormatOfBytes(disk.get('provisionedSize'))
  const actSize = userFormatOfBytes(disk.get('actualSize'), provSize.suffix)

  const capacityInfoContent = (
    <div>
      Used: {actSize.str}
      <br />
      Total: {provSize.str}
    </div>
  )
  const capacityInfo = (<FieldHelp
    title='Disk Capacity'
    content={capacityInfoContent}
    text={<span className={style['light']}>({actSize.rounded}/{provSize.str} used)</span>} />)

  return (
    <li>
      <span>
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
      /* open */
      } = this.props

    if (!disks || disks.isEmpty()) {
      return null
    }

    let classes = style['disks-list']
/*    if (open) { // show/hide button recently not used
      classes += ` ${style['open-disks']}`
    }
*/

    let disksToRender = disks.sort((a, b) => a.get('name').localeCompare(b.get('name')) - (a.get('bootable') ? 1000 : 0))
    if (!this.state.renderMore) {
      disksToRender = disksToRender.slice(0, 2)
    }

    let moreButton = null
    if (this.state.renderMore) {
      moreButton = (
        <div className={style['button-more']} onClick={() => this.setState({ renderMore: false })}>
          less
        </div>
      )
    } else {
      const hiddenCount = disks.size - 2
      if (hiddenCount > 0) {
        moreButton = (
          <div className={style['button-more']} onClick={() => this.setState({ renderMore: true })}>
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
  disks: PropTypes.object,
  open: PropTypes.bool,
}

export default VmDisks
