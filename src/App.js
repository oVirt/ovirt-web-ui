import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import style from './App.css'

import VmsPageHeader from './components/VmsPageHeader'

import VmsList from './components/VmsList/index'
import VmDetail from './components/VmDetail'
import Options from './components/Options'
import AboutDialog from './components/About'
import OvirtApiCheckFailed from './components/OvirtApiCheckFailed'
import CloseDialogConfirmation from './components/CloseDialogConfirmation/index'

import AddVmButton from './components/VmDialog/AddVmButton'
import VmDialog from './components/VmDialog/index'

const App = ({ vms, visibility }) => {
  const selectedVmId = visibility.get('selectedVmDetail') // TODO: move to 'connect()' function
  const selectedVm = selectedVmId ? vms.getIn(['vms', selectedVmId]) : undefined
  const isCloseDialogConfirmation = visibility.get('dialogCloseConfirmationToShow')

  let detailToRender = null
  switch (visibility.get('dialogToShow')) {
    case 'Options':
      detailToRender = (<Options />)
      break
    case 'VmDialog':
      detailToRender = (<VmDialog vm={selectedVm} />)
      break
    case 'VmDetail':
      detailToRender = (<VmDetail vm={selectedVm} />)
      break
  }

  let closeDialogConfirmation = null
  if (detailToRender && isCloseDialogConfirmation) {
    closeDialogConfirmation = (<CloseDialogConfirmation />)
  }

  const addVmButton = detailToRender ? null : <AddVmButton name='Add New Virtual Machine' />

  return (
    <div>
      <VmsPageHeader title='oVirt VM Portal' />
      <div className={'container-fluid ' + style['navbar-top-offset']}>
        <div className={style['main-actions']}>
          {addVmButton}
        </div>

        <VmsList />
        {detailToRender}
      </div>
      {closeDialogConfirmation}
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
