import React from 'react'
import PropTypes from 'prop-types'

import { withMsg } from '_/intl'
import FieldHelp from '../FieldHelp/index'

import style from './style.css'

const MAX_ICON_SIZE = 24 // in KiB; checked by oVirt API

class IconUpload extends React.Component {
  constructor (props) {
    super(props)
    this.handleIconChange = this.handleIconChange.bind(this)
  }

  handleIconChange (e) {
    const { msg } = this.props
    const that = this
    const files = e.target.files

    if (files.length > 0) {
      const file = files[0]

      if (file.size > MAX_ICON_SIZE * 1024) {
        that.props.onErrorChange(msg.uploadIconFilesizeTooLarge({ maxIconSize: MAX_ICON_SIZE }))
        return
      }

      const reader = new FileReader()

      reader.onload = function (upload) {
        let iconBase64 = upload.target.result
        iconBase64 = iconBase64.replace('data:', '')
        const semiIndex = iconBase64.indexOf(';')
        const mimeType = iconBase64.slice(0, semiIndex)

        if (mimeType.includes('image')) {
          iconBase64 = iconBase64.slice(semiIndex + 1).replace('base64,', '')
          that.props.onIconChange({
            mediaType: mimeType,
            data: iconBase64,
          })
        } else {
          that.props.onErrorChange(msg.uploadIconNotImage())
        }
      }
      reader.readAsDataURL(file)
    }
  }

  render () {
    const { error, msg } = this.props

    const iconError = this.props.error
      ? (<span className={`help-block ${style['error-text']}`}>{this.props.error}</span>)
      : null

    return (
      <React.Fragment>
        <dt>
          <FieldHelp content={msg.customIcon()} text={msg.icon()} />
        </dt>
        <dd className={error ? 'has-error' : ''}>
          <label id='button-upload-icon' className='btn btn-default' type='button'>
            {msg.upload()}
            <input
              id='uploadIconInput'
              type='file'
              accept='image/*'
              className={style['hide']}
              value={''}
              onChange={this.handleIconChange}
            />
          </label>
          <button
            id='button-default-icon'
            className={`btn btn-default ${style['upload-button']}`}
            type='button'
            onClick={() => { this.props.onIconChange() }} >
            {msg.defaultButton()}
          </button>
          {iconError}
        </dd>
      </React.Fragment>
    )
  }
}

IconUpload.propTypes = {
  /* eslint-disable-next-line react/no-unused-prop-types */
  onErrorChange: PropTypes.func.isRequired,
  onIconChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  msg: PropTypes.object.isRequired,
}

export default withMsg(IconUpload)
