import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { downloadConsole } from '../../actions/index'

import Confirmation from '../Confirmation/index'
import Popover from '../Confirmation/Popover'
import { msg } from '../../intl'

import style from './style.css'

import { checkConsoleInUse, setConsoleInUse } from './actions'

class ConsoleButton extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      openModal: false,
    }
    this.consoleConfirmationAboutToOpen = this.consoleConfirmationAboutToOpen.bind(this)
    this.onConsoleConfirmationClose = this.onConsoleConfirmationClose.bind(this)
    this.onConsoleDownload = this.onConsoleDownload.bind(this)
  }

  consoleConfirmationAboutToOpen (e) {
    this.setState({
      openModal: true,
    })
    this.props.onCheckConsoleSessionInUse()
  }

  onConsoleConfirmationClose () {
    this.setState({
      openModal: false,
    })
    this.props.onConsoleSessionConfirmaClose()
  }

  onConsoleDownload () {
    this.setState({
      openModal: false,
    })

    this.props.onDownloadConsole()
  }

  render () {
    let {
      vm,
      className,
      tooltip = '',
      actionDisabled = false,
      isOnCard,
      shortTitle,
      button,
      VmAction,
    } = this.props

    const idPrefix = `consoleaction-${vm.get('name')}`

    let onClick = this.consoleConfirmationAboutToOpen
    if (actionDisabled) {
      className = `${className} ${style['action-disabled']}`
      onClick = undefined
    }
    let popoverComponent = null
    if (VmAction.getIn(['vms', vm.get('id'), 'consoleInUse']) && this.state.openModal) {
      popoverComponent = (<Popover width={200} height={80} target={this} placement={isOnCard ? 'top' : 'bottom'} show>
        <Confirmation
          text={msg.consoleInUseContinue()}
          okButton={{ label: msg.yes(), click: this.onConsoleDownload }}
          cancelButton={{ label: msg.cancel(), click: this.onConsoleConfirmationClose }}
          uniqueId={vm.get('name')} />
      </Popover>)
    }

    if (isOnCard) {
      return (
        <div className='card-pf-item'>
          <span className={className} data-toggle='tooltip' data-placement='left' title={tooltip} onClick={onClick} />
          {popoverComponent}
        </div>
      )
    }

    if (actionDisabled) {
      return (
        <button className={`${button} ${style['disabled-button']}`} disabled='disabled' id={`${idPrefix}-disabled`}>
          <span data-toggle='tooltip' data-placement='left' title={tooltip}>
            {shortTitle}
          </span>
        </button>
      )
    }

    return (
      <span className={style['full-button']}>
        <a href='#' onClick={this.consoleConfirmationAboutToOpen} className={`${button} ${style['link']}`} id={shortTitle}>
          <span data-toggle='tooltip' data-placement='left' title={tooltip}>
            {shortTitle}
          </span>
        </a>
        {popoverComponent}
      </span>
    )
  }
}

ConsoleButton.propTypes = {
  vm: PropTypes.object.isRequired,
  VmAction: PropTypes.object.isRequired,
  usbFilter: PropTypes.string.isRequired,
  consoleId: PropTypes.string,
  className: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
  shortTitle: PropTypes.string.isRequired,
  button: PropTypes.string.isRequired,
  actionDisabled: PropTypes.bool,
  isOnCard: PropTypes.bool,
  userId: PropTypes.string,
  onDownloadConsole: PropTypes.func.isRequired,
  onConsoleSessionConfirmaClose: PropTypes.func.isRequired,
  onCheckConsoleSessionInUse: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    VmAction: state.VmAction,
  }),
  (dispatch, { vm, consoleId, usbFilter, userId }) => ({
    onCheckConsoleSessionInUse: () => dispatch(checkConsoleInUse({ vmId: vm.get('id'), usbFilter, userId })),
    onConsoleSessionConfirmaClose: () => dispatch(setConsoleInUse({ vmId: vm.get('id'), consoleInUse: false })),
    onDownloadConsole: () => dispatch(downloadConsole({ vmId: vm.get('id'), consoleId, usbFilter })),
  })
)(ConsoleButton)
