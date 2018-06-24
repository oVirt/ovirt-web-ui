import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { downloadConsole, checkConsoleInUse, setConsoleInUse } from '../../actions'
import { msg } from '../../intl'

import Confirmation from '../Confirmation'
import Popover from '../Confirmation/Popover'
import style from './style.css'

/**
 * Button to send a virt-viewer connection file to the user for a VM's SPICE or VNC
 * console, defaulting to the SPICE console if a specific __consoleId__ isn't provided.
 */
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
    this.props.onConsoleSessionConfirmClose()
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
      isOnCard = false,
      actionDisabled = false,
      shortTitle,
      tooltip = '',
      button,
      className,
    } = this.props

    const idPrefix = `consoleaction-${vm.get('name')}`

    let onClick = this.consoleConfirmationAboutToOpen
    if (actionDisabled) {
      className = `${className} ${style['action-disabled']}`
      onClick = undefined
    }

    let popoverComponent = null
    if (vm.get('consoleInUse') && this.state.openModal) {
      popoverComponent = (
        <Popover width={200} height={80} target={this} placement={isOnCard ? 'top' : 'bottom'} show>
          <Confirmation
            text={msg.consoleInUseContinue()}
            okButton={{ label: msg.yes(), click: this.onConsoleDownload }}
            cancelButton={{ label: msg.cancel(), click: this.onConsoleConfirmationClose }}
            uniqueId={vm.get('name')} />
        </Popover>
      )
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
        <a href='#' onClick={onClick} className={`${button} ${style['link']}`} id={shortTitle}>
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

  isOnCard: PropTypes.bool,
  actionDisabled: PropTypes.bool,
  shortTitle: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
  button: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,

  consoleId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  usbFilter: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  userId: PropTypes.string, // eslint-disable-line react/no-unused-prop-types

  onCheckConsoleSessionInUse: PropTypes.func.isRequired,
  onConsoleSessionConfirmClose: PropTypes.func.isRequired,
  onDownloadConsole: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({ // TODO: memorize the selectors (using 'reselect'), but per-instance since it needs ownProps?
    usbFilter: state.config.get('usbFilter'),
    userId: state.config.getIn(['user', 'id']),
  }),
  (dispatch, { vm, consoleId, usbFilter, userId }) => ({
    onCheckConsoleSessionInUse: () => dispatch(checkConsoleInUse({ vmId: vm.get('id'), usbFilter, userId })),
    onConsoleSessionConfirmClose: () => dispatch(setConsoleInUse({ vmId: vm.get('id'), consoleInUse: false })),
    onDownloadConsole: () => dispatch(downloadConsole({ vmId: vm.get('id'), consoleId, usbFilter })),
  })
)(ConsoleButton)
