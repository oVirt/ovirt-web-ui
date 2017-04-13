import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import style from './App.css'

import VmsPageHeader from './components/VmsPageHeader'

import VmsList from './components/VmsList'
import VmDetail from './components/VmDetail'
import Options from './components/Options'
import AboutDialog from './components/About'
import OvirtApiCheckFailed from './components/OvirtApiCheckFailed'

const App = ({ vms, visibility }) => {
  const selectedVmId = visibility.get('selectedVmDetail')
  const showOptions = visibility.get('showOptions')

  let detailToRender = ''
  if (showOptions) {
    detailToRender = (<Options />)
  } else if (selectedVmId) {
    const selectedVm = selectedVmId ? vms.getIn(['vms', selectedVmId]) : undefined
    detailToRender = (<VmDetail vm={selectedVm} />)
  }

  return (
    <div>
      <VmsPageHeader title='oVirt VM Portal' />
      <div className={'container-fluid ' + style['navbar-top-offset']}>
        <VmsList />
        {detailToRender}
      </div>
      <AboutDialog />
      <OvirtApiCheckFailed />
    </div>
  )
}
App.propTypes = {
  vms: PropTypes.object.isRequired,
  visibility: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
    visibility: state.visibility,
  })
)(App)
