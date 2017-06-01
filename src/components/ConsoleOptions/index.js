import React from 'react'
import PropTypes from 'prop-types'

import Switch from 'react-bootstrap-switch'

import style from './style.css'

import { logDebug } from '../../helpers'

class ConsoleOptions extends React.Component {
  constructor (props) {
    super(props)
    this.onChangeOptions = this.onChangeOptions.bind(this)
  }

  onChangeOptions (option) {
    return function (elem, value) {
      const delta = {}
      switch (option) {
        case 'autoConnect':
        default:
          delta[option] = value
          break
      }
      this.props.onSave({ options: Object.assign({}, this.state, delta) })
    }.bind(this)
  }

  render () {
    logDebug('ConsoleOptions from web-ui, props.options: ', this.props.options)
    const { open } = this.props

    let classes = style['vm-detail-settings']
    if (open) {
      classes += ` ${style['open-settings']}`
    }

    // see index-nomodules.css for custom Switch styling
    return (
      <div className={classes}>
        <dl>
          <dt>Connect automatically</dt>
          <dd>
            <Switch
              animate={false}
              value={!!this.props.options.autoConnect}
              onChange={this.onChangeOptions('autoConnect')}
            />
          </dd>
        </dl>
      </div>
    )
  }
}

ConsoleOptions.propTypes = {
  options: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  open: PropTypes.bool,
}

export default ConsoleOptions
