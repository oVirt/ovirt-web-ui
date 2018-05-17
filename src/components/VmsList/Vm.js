import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import {
  Link,
  NavLink,
  withRouter,
} from 'react-router-dom'

import style from './style.css'

import VmStatusText from './VmStatusText'
import VmActions from '../VmActions'
import VmIcon from '../VmIcon'
import VmStatusIcon from '../VmStatusIcon'

import { startVm } from '../../actions/index'

import { getOsHumanName, getVmIcon } from '../utils'

/**
 * Single icon-card in the list
 */
class Vm extends React.Component {
  render () {
    let { vm, icons, visibility, onStart, os } = this.props
    const idPrefix = `vm-${vm.get('name')}`
    const state = vm.get('status')
    const icon = getVmIcon(icons, os.get('operatingSystems'), vm)
    const isSelected = vm.get('id') === visibility.get('selectedVmDetail')
    const osName = getOsHumanName(vm.getIn(['os', 'type']))

    return (
      <div className={`col-xs-12 col-sm-6 col-md-4 col-lg-3 ${isSelected ? style['selectedVm'] : ''}`}>
        <div className='card-pf card-pf-view card-pf-view-select card-pf-view-single-select'>
          <div className='card-pf-body'>
            <div className={`card-pf-top-element ${style['card-icon']}`}>
              <Link to={`/vm/${vm.get('id')}`}>
                <VmIcon icon={icon} className={style['card-pf-icon']}
                  missingIconClassName='fa fa-birthday-cake card-pf-icon-circle' />
              </Link>
              <div>
                <span className={style['operating-system-label']}>{osName}</span>
              </div>
            </div>
            <h2 className='card-pf-title text-center'>
              <NavLink to={`/vm/${vm.get('id')}`} className={style['vm-detail-link']}>
                <p className={[style['vm-name'], style['crop']].join(' ')} title={vm.get('name')} data-toggle='tooltip' id={`${idPrefix}-status-name`}>
                  <VmStatusIcon state={state} />&nbsp;{vm.get('name')}
                </p>
              </NavLink>
            </h2>

            <VmActions vm={vm} isOnCard onStart={onStart} />
            <VmStatusText vm={vm} />

          </div>
        </div>
      </div>
    )
  }
}

Vm.propTypes = {
  vm: PropTypes.object.isRequired,
  icons: PropTypes.object.isRequired,
  os: PropTypes.object.isRequired,
  onStart: PropTypes.func.isRequired,
  visibility: PropTypes.object.isRequired,
}

export default withRouter(connect(
  (state) => ({
    icons: state.icons,
    visibility: state.visibility,
    os: state.operatingSystems,
  }),
  (dispatch, { vm }) => ({
    onStart: () => dispatch(startVm({ vmId: vm.get('id') })),
  })
)(Vm))
