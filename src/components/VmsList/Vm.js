import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import {
  Redirect,
  withRouter,
} from 'react-router-dom'

import style from './style.css'

import VmStatusText from './VmStatusText'
import VmActions from '../VmActions'
import { VmIcon, VmStatusIcon } from 'ovirt-ui-components'
import { closeAllConfirmationComponents } from '../Confirmation'

import { startVm } from '../../actions/index'

import { logDebug } from '../../helpers'

/**
 * Single icon-card in the list
 */
class Vm extends React.Component {
/*  constructor (props) {
    super(props)
    this.state = { openDetail: false }
  }
*/
  render () {
    let { vm, icons, visibility, onStart } = this.props
/*
    if (this.state.openDetail) {
      return (<Redirect to={`/vm/${vm.get('id')}`} />)
    }
*/
    const state = vm.get('status')

    const iconId = vm.getIn(['icons', 'large', 'id'])
    const icon = icons.get(iconId)
    const isSelected = vm.get('id') === visibility.get('selectedVmDetail')

    const onCardClick = () => {
      logDebug('========== VM card clicked: ', vm.get('name'))
      closeAllConfirmationComponents()
      // onSelectVm()
//      this.setState({ openDetail: true })
      return (<Redirect to={`/vm/${vm.get('id')}`} />)
    }

    return (
      <div className={`col-xs-12 col-sm-6 col-md-4 col-lg-3 ${isSelected ? style['selectedVm'] : ''}`}>
        <div className='card-pf card-pf-view card-pf-view-select card-pf-view-single-select'>
          <div className='card-pf-body'>
            <div className='card-pf-top-element' onClick={onCardClick}>
              <VmIcon icon={icon} className={style['card-pf-icon']}
                missingIconClassName='fa fa-birthday-cake card-pf-icon-circle' />
            </div>
            <h2 className='card-pf-title text-center' onClick={onCardClick}>
              <p className={[style['vm-name'], style['crop']].join(' ')} title={vm.get('name')} data-toggle='tooltip'>
                <VmStatusIcon state={state} />&nbsp;{vm.get('name')}
              </p>
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
  onStart: PropTypes.func.isRequired,
  visibility: PropTypes.object.isRequired,
}

export default withRouter(connect(
  (state) => ({
    icons: state.icons,
    visibility: state.visibility,
  }),
  (dispatch, { vm }) => ({
    onStart: () => dispatch(startVm({ vmId: vm.get('id') })),
  })
)(Vm))
