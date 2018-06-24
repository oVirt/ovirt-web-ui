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
    if (e) e.preventDefault()

    this.setState({
      openModal: true,
    })
    this.props.onCheckConsoleSessionInUse(this.props.userId, this.props.usbFilter)
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

    this.props.onDownloadConsole(this.props.usbFilter)
  }

  render () {
    const {
      vm,
      isOnCard = false,
      actionDisabled = false,
      shortTitle,
      tooltip = '',
      button,
      className,
    } = this.props

    const idPrefix = `consoleaction-${vm.get('name')}`

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
      const onClick = actionDisabled ? () => {} : this.consoleConfirmationAboutToOpen
      return (
        <div className='card-pf-item'>
          <span
            className={`${className} ${actionDisabled ? style['action-disabled'] : ''}`}
            data-toggle='tooltip'
            data-placement='left'
            title={tooltip}
            onClick={onClick}
          />
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
        <a href='#' className={`${button} ${style['link']}`} id={shortTitle} onClick={this.consoleConfirmationAboutToOpen}>
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
  usbFilter: PropTypes.string,
  userId: PropTypes.string,

  onCheckConsoleSessionInUse: PropTypes.func.isRequired,
  onConsoleSessionConfirmClose: PropTypes.func.isRequired,
  onDownloadConsole: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    usbFilter: state.config.get('usbFilter'),
    userId: state.config.getIn(['user', 'id']),
  }),
  (dispatch, { vm, consoleId }) => ({
    onCheckConsoleSessionInUse: (userId, usbFilter) => dispatch(checkConsoleInUse({ vmId: vm.get('id'), userId, usbFilter })),
    onConsoleSessionConfirmClose: () => dispatch(setConsoleInUse({ vmId: vm.get('id'), consoleInUse: false })),
    onDownloadConsole: (usbFilter) => dispatch(downloadConsole({ vmId: vm.get('id'), consoleId, usbFilter })),
  })
)(ConsoleButton)
