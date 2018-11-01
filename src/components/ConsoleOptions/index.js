import React from 'react'
import PropTypes from 'prop-types'

import Switch from 'react-bootstrap-switch'

import style from './style.css'
import FieldHelp from '../FieldHelp/index'
import { msg } from 'app-intl'

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

  componentWillMount () {
    if (!this.props.smartcardOptionEnable) {
      (this.onChangeOptions('smartcardEnabled'))(null, false)
    }
  }

  render () {
    const { open, smartcardOptionEnable } = this.props

    let classes = style['vm-detail-settings']
    if (open) {
      classes += ` ${style['open-settings']}`
    }

    // see index-nomodules.css for custom Switch styling
    return (
      <div className={classes}>
        <dl>
          <dt className={style['console-option-description']}>{msg.connectAutomatically()}</dt>
          <dd>
            <Switch
              animate
              bsSize='mini'
              value={!!this.props.options.autoConnect}
              onChange={this.onChangeOptions('autoConnect')}
            />
          </dd>

          <dt className={style['console-option-description']}>{msg.fullScreen()}</dt>
          <dd>
            <Switch
              animate
              bsSize='mini'
              value={!!this.props.options.fullscreen}
              onChange={this.onChangeOptions('fullscreen')}
            />
          </dd>

          <dt className={style['console-option-description']}>
            <FieldHelp content={msg.mapCtrlAltDelKeyboardShortcutToCtrlAltEnd()} text={msg.useCtrlAltEnd()} />
          </dt>
          <dd>
            <Switch
              animate
              bsSize='mini'
              value={!!this.props.options.ctrlAltDelToEnd}
              onChange={this.onChangeOptions('ctrlAltDelToEnd')}
            />
          </dd>

          <dt className={style['console-option-description']}>{msg.smartcardEnabled()}</dt>
          <dd>
            <Switch
              animate
              bsSize='mini'
              disabled={!smartcardOptionEnable}
              value={!!this.props.options.smartcardEnabled}
              onChange={this.onChangeOptions('smartcardEnabled')}
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
  smartcardOptionEnable: PropTypes.bool,
}

export default ConsoleOptions
