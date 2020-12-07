
import React from 'react'
import PropTypes from 'prop-types'

import { Alert } from 'patternfly-react'
import style from './sharedStyle.css'

class CounterAlert extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      counter: props.timeout,
      showAlert: true,
    }

    this.decrementCounter = this.decrementCounter.bind(this)
    this.handleDismiss = this.handleDismiss.bind(this)
    this.timer = props.timeout > 0 ? setInterval(this.decrementCounter, 1000) : null
  }

  decrementCounter () {
    this.setState(
      state => ({ counter: state.counter - 1 }),
      () => {
        if (this.state.counter <= 0) {
          this.handleDismiss()
        }
      }
    )
  }

  componentWillUnmount () {
    clearInterval(this.timer)
  }

  handleDismiss () {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.setState({ showAlert: false })
    this.props.onDismiss()
  }

  render () {
    const { title, type, children } = this.props
    return this.state.showAlert &&
      <Alert type={type} onDismiss={this.handleDismiss} className={style['text-align-left']}>
        {title}
        {children}
      </Alert>
  }
}

CounterAlert.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  children: PropTypes.node,
  /**
   * A timeout of <= 0 will force a manual dismiss of the alert.
   */
  timeout: PropTypes.number,

  type: PropTypes.string,

  onDismiss: PropTypes.func,
}

CounterAlert.defaultProps = {
  type: 'success',
  onDismiss: () => {},
}

export default CounterAlert
