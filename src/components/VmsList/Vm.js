import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { Link, withRouter } from 'react-router-dom'

import sharedStyle from '../sharedStyle.css'
import style from './style.css'

import VmActions from '../VmActions'
import VmIcon from '../VmIcon'
import VmStatusIcon from '../VmStatusIcon'

import { startVm } from '../../actions/index'

import { getOsHumanName, getVmIcon } from '../utils'
import { enumMsg } from '../../intl'

/**
 * Single icon-card in the list for a VM
 */
const Vm = ({ vm, icons, os, onStart }) => {
  const idPrefix = `vm-${vm.get('name')}`
  const state = vm.get('status')
  const stateValue = enumMsg('VmStatus', state)
  const osName = getOsHumanName(vm.getIn(['os', 'type']))
  const icon = getVmIcon(icons, os, vm)

  return (
    <div className={`col-xs-12 col-sm-6 col-md-4 col-lg-3`} id={`${idPrefix}-box`}>
      <div className='card-pf card-pf-view card-pf-view-select card-pf-view-single-select'>
        <div>
          <span className={sharedStyle['operating-system-label']}>{osName}</span>
        </div>
        <div className='card-pf-body'>
          <div className={`card-pf-top-element ${style['card-icon']}`}>
            <Link to={`/vm-legacy/${vm.get('id')}`}>
              <VmIcon icon={icon} className={style['card-pf-icon']}
                missingIconClassName='fa fa-birthday-cake card-pf-icon-circle' />
            </Link>
          </div>

          <h2 className={`card-pf-title text-center ${style['status-height']}`}>
            <Link to={`/vm-legacy/${vm.get('id')}`} className={style['vm-detail-link']}>
              <p className={`${style['vm-name']} ${style['crop']}`} title={vm.get('name')} data-toggle='tooltip' id={`${idPrefix}-name`}>
                {vm.get('name')}
              </p>
            </Link>
            <p className={`${style['vm-status']}`} id={`${idPrefix}-status`}>
              <VmStatusIcon state={state} />&nbsp;{stateValue}
            </p>
          </h2>

          <VmActions isOnCard vm={vm} onStart={onStart} idPrefix={idPrefix} />
        </div>
      </div>
    </div>
  )
}
Vm.propTypes = {
  vm: PropTypes.object.isRequired,
  icons: PropTypes.object.isRequired,
  os: PropTypes.object.isRequired,
  onStart: PropTypes.func.isRequired,
}

export default withRouter(connect(
  (state) => ({
    icons: state.icons,
    os: state.operatingSystems, // deep immutable, {[id: string]: OperatingSystem}
  }),
  (dispatch, { vm }) => ({
    onStart: () => dispatch(startVm({ vmId: vm.get('id') })),
  })
)(Vm))
