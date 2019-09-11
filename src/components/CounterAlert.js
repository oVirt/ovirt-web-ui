
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
    this.timer = props.timeout ? setInterval(this.decrementCounter, 1000) : null
  }

  decrementCounter () {
    const state = {
      counter: this.state.counter - 1,
    }
    if (this.state.counter <= 0) {
      clearInterval(this.timer)
      this.timer = null
      this.handleDismiss()
    }
    this.setState(state)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
  }

  handleDismiss () {
    this.setState({ showAlert: false })
  }

  render () {
    const { title, type } = this.props
    return this.state.showAlert &&
      <Alert type={type} onDismiss={this.handleDismiss} className={style['text-align-left']}>
        {title}
      </Alert>
  }
}
CounterAlert.propTypes = {
  title: PropTypes.string.isRequired,
  timeout: PropTypes.number,
  type: PropTypes.string,
}

CounterAlert.defaultProps = {
  type: 'success',
}

export default CounterAlert
