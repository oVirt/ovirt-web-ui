import React from 'react'
import VmsList from '../VmsList/index'

import style from './style.css'

const VmsPage = () => {
  return (<div className={`container-fluid ${style['vms-page']}`}>
    <VmsList />
  </div>)
}

export default VmsPage
