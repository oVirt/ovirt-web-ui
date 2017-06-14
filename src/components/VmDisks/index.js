import React, { PropTypes } from 'react'

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
    text={<span className={style['light']}>({actSize.number}/{provSize.str} used)</span>} />)

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

const VmDisks = ({ disks, open }) => {
  if (disks && !disks.isEmpty()) {
    let classes = style['disks-list']
    if (open) {
      classes += ` ${style['open-disks']}`
    }

    return (
      <div className={classes}>
        <ul className={style['disks-ul']}>
          {disks.map(disk => <VmDisk disk={disk} key={disk.get('id')} />)}
        </ul>
      </div>
    )
  }
  return null
}
VmDisks.propTypes = {
  disks: PropTypes.object,
  open: PropTypes.bool,
}

export default VmDisks
