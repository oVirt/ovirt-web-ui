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
      delta[option] = value
      // redux change follows -> props will be changed
      this.props.onSave({ options: Object.assign({}, this.props.options, delta) })
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
          <dt className={style['console-option-description']}>Connect automatically</dt>
          <dd>
            <Switch
              animate
              value={!!this.props.options.autoConnect}
              onChange={this.onChangeOptions('autoConnect')}
            />
          </dd>

          <dt className={style['console-option-description']}>Fullscreen</dt>
          <dd>
            <Switch
              animate
              value={!!this.props.options.fullscreen}
              onChange={this.onChangeOptions('fullscreen')}
            />
          </dd>

          <dt className={style['console-option-description']}>Map ctrl+alt+del shortcut to ctrl+alt+end</dt>
          <dd>
            <Switch
              animate
              value={!!this.props.options.ctrlAltDelToEnd}
              onChange={this.onChangeOptions('ctrlAltDelToEnd')}
            />
          </dd>

          <div className={style['console-client-resources']}>
            Refer <a href='https://www.ovirt.org/documentation/admin-guide/virt/console-client-resources/' target='_blank'>Console Client Resources</a> in case of troubles.
          </div>
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
