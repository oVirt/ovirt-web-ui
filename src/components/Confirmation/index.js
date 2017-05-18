import React from 'react'
import PropTypes from 'prop-types'

import ReactDOM from 'react-dom'
import { Popover, Button, ButtonToolbar } from 'react-bootstrap'

import { logDebug } from '../../helpers'

import style from './style.css'

/**
 * Example of use:
 * <button className='top-btn'
 *         onClick={(e) =>
 *              OnClickTopConfirmation({
 *                 target, // DOM element the confirmation will be sticked to
 *                 confirmationText, // Text/Component to be rendered
 *                 cancelLabel,
 *                 okLabel,
 *                 extraButtonLabel,
 *                 id, // unique namespace
 *                 onOk, // action to be executed
 *                 onExtra, // action to be executed after onClick()
 *                 width, height, // or use defaults
 *                 })}>
 *      Delete Something
 * </button>
 */
const OnClickTopConfirmation = ({ target, confirmationText, cancelLabel, okLabel, extraButtonLabel, id, onOk, onExtra, onCancel, width, height }) => {
  showConfirmation({
    confirmationText,
    okLabel,
    cancelLabel,
    extraButtonLabel,
    placement: 'top',
    element: target,
    uniqueId: id,
    width,
    height,
  }).then(
    (result) => {
      if (result === 'ok' && onOk) {
        onOk()
      } else if (result === 'extra' && onExtra) {
        onExtra()
      } else if (onCancel) {
        onCancel()
      }
    },
    (result) => {
      logDebug('OnClickTopConfirmation: cancel called', result)
      if (onCancel) {
        onCancel()
      }
    }
  )
}

/**
 * A Promise is returned
 */
const showConfirmation = (options) => {
  const containerId = `confirmation-container-${options.uniqueId}`
  const container = document.getElementById(containerId)
  if (container) {
    ReactDOM.unmountComponentAtNode(container)
  }
  return createConfirmation(Confirmation)({ containerId, ...options })
}

export const closeAllConfirmationComponents = () => {
  const containers = document.getElementsByClassName('confirmation-container')
  for (let i = 0; i < containers.length; i++) {
    const container = containers[i]
    ReactDOM.unmountComponentAtNode(container)
  }
}

const createConfirmation = () => {
  return (props) => {
    const { containerId } = props
    const container = document.getElementById(containerId)
    const wrapper = document.body.appendChild(container || document.createElement('div'))
    wrapper.id = containerId
    wrapper.className = 'confirmation-container'

    function dispose () {
      setTimeout(() => {
        ReactDOM.unmountComponentAtNode(wrapper)
        setTimeout(() => wrapper.remove(), 0)
      }, 1)
    }

    const promise = new Promise((resolve, reject) => {
      try {
        ReactDOM.render(
          <Confirmation
            reject={reject}
            resolve={resolve}
            {...props}
          />,
          wrapper
        )
      } catch (e) {
        console.error(e)
        throw e
      }
    })

    return promise.then((result) => {
      dispose()
      return result
    }, (result) => {
      dispose()
      return Promise.reject(result)
    })
  }
}

/**
 * Represents ConfirmationContent enriched for callbacks
 */
class Confirmation extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      show: true,
    }

    this.proceed = this.proceed.bind(this)
    this.cancel = this.cancel.bind(this)
    this.onExtra = this.onExtra.bind(this)
  }
  cancel () {
    this.setState({
      show: false,
    }, () => {
      this.props.reject('cancel')
    })
  }
  proceed () {
    this.setState({
      show: false,
    }, () => {
      this.props.resolve('ok')
    })
  }
  onExtra () {
    this.setState({
      show: false,
    }, () => {
      this.props.resolve('extra')
    })
  }
  render () {
    return <ConfirmationContent onOkClicked={this.proceed} onCancelClicked={this.cancel} onExtraButtonClicked={this.onExtra}
      {...this.props} />
  }
}
Confirmation.propTypes = {
  reject: PropTypes.func,
  resolve: PropTypes.func,
}

class ConfirmationContent extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      width: this.props.width || 200,
      height: this.props.height || 80,
      positionLeft: 0,
      positionTop: 0,
    }

    this.onScroll = this.onScroll.bind(this)
    this.computePosition = this.computePosition.bind(this)
  }

  onScroll () {
    logDebug('onScroll() called')
    this.computePosition()
  }

  componentDidMount () {
    this.computePosition()

    window.addEventListener('resize', this.onScroll)
    document.querySelector('.actions-line').addEventListener('scroll', this.onScroll)
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this.onScroll)
  }

  computePosition () {
    const { element, placement } = this.props
    const { width, height } = this.state
    let { positionLeft, positionTop } = this.state

    if (element) {
      const { x, y } = this.getElementPosition(element)
      switch (placement) {
        case 'top': {
          positionLeft = x + element.clientWidth / 2 - width / 2
          positionTop = y - 10 - (height - 4)
          positionTop = positionTop >= 0 ? positionTop : 0
          break
        }
        case 'bottom': {
          positionLeft = x + element.clientWidth / 2 - width / 2
          positionTop = y + 10 + element.clientHeight
          break
        }
        case 'left': {
          positionLeft = x - width - 10
          positionTop = y + element.clientHeight / 2 - height / 2
          break
        }
        case 'right': {
          positionLeft = x + 10 + element.clientWidth
          positionTop = y + element.clientHeight / 2 - height / 2
          break
        }
      }
    }

    this.setState({
      positionLeft,
      positionTop,
    })
  }

  render () {
    const {
      okLabel = 'Yes',
      cancelLabel = 'No',
      extraButtonLabel = '',
      confirmationText, // or React component

      onOkClicked,
      onCancelClicked,
      onExtraButtonClicked,

      placement = 'top',
    } = this.props

    const {
      positionLeft,
      positionTop,
      width,
      height,
    } = this.state

    let extraButton = null
    if (extraButtonLabel) {
      extraButton = (
        <Button bsSize='xsmall' className={`${style['confirmation-extra-button']} button-l`} bsStyle='info' onClick={onExtraButtonClicked}>
          {extraButtonLabel}
        </Button>
      )
    }

    return (
      <div className='static-confirm'>
        <Popover id='pop-confirm'
          style={{ width: `${width}px`, height: `${height}px` }}
          placement={placement}
          positionLeft={positionLeft}
          positionTop={positionTop}>
          {typeof confirmationText === 'string'
            ? (
              <p className={style['confirmation-text']}>
                {confirmationText}
              </p>)
              : confirmationText }
          <ButtonToolbar className={style['confirmation-toolbar']}>
            <Button bsSize='xsmall' className={`button-l ${style['ok-button']}`} bsStyle='info' onClick={onOkClicked}>
              {okLabel}
            </Button>
            <Button bsSize='xsmall' onClick={onCancelClicked}>
              {cancelLabel}
            </Button>
            {extraButton}
          </ButtonToolbar>
        </Popover>
      </div>
    )
  }

  getElementPosition (e) {
    const rect = e.getBoundingClientRect()
    const x = rect.left
    const y = rect.top
    return { x, y }
  }
}
ConfirmationContent.propTypes = {
  okLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  extraButtonLabel: PropTypes.string,
  confirmationText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),

  onOkClicked: PropTypes.func,
  onCancelClicked: PropTypes.func,
  onExtraButtonClicked: PropTypes.func,

  element: PropTypes.object.isRequired,

  placement: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,

  positionLeft: PropTypes.number,
  positionTop: PropTypes.number,
}

export default OnClickTopConfirmation
