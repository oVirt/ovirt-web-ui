import React from 'react'
import PropTypes from 'prop-types'
import {
  CardVm,
} from './Vm'
import {
  CardPool,
} from './Pool'

import style from './style.css'
import { Gallery, GalleryItem } from '@patternfly/react-core'

/**
 * Use Patternfly 'Single Select Card View' pattern to show every VM and Pool
 * available to the current user.
 *
 * NOTE: It is important that the first page of VMs & Pools has already been loaded
 * before this component is rendered.  This will prevent two "initial page" fetches
 * from running at the same time.  The `VmsList` component handles this normally.
 */
const VmCardList = ({ vmsAndPools }) => {
  return (
    <Gallery hasGutter className={style['gallery-container']}>
      {vmsAndPools.map(entity => (
        <GalleryItem key={entity.get('id')}>{
            entity.get('isVm')
              ? <CardVm vm={entity} />
              : <CardPool pool={entity} />}
        </GalleryItem>
      ))}
    </Gallery>
  )
}
VmCardList.propTypes = {
  vmsAndPools: PropTypes.array.isRequired,
}

export default VmCardList
