import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'
import style from './style.css'

/**
 * Large or small icon (image) associated with the VM
 * or default when icon not provided
 */
const VmIcon = ({ icon, className, missingIconClassName, showEdit, onIconChange, onIconDefault }) => {
  const openFileDialog = () => {
    $('input#uploadIconInput').trigger('click')
  }
  if (icon) {
    const data = icon.get('data')
    const type = icon.get('type')

    let edit = null
    if (showEdit) {
      edit = (<div className={style['btn-box']}>
        <span onClick={openFileDialog} className={style['btn']} data-toggle='tooltip' data-placement='left' title='Set custom icon'><i className='pficon pficon-edit' /></span>
        <span onClick={onIconDefault} className={style['btn']} data-toggle='tooltip' data-placement='left' title='Set default icon'><i className='pficon pficon-spinner2' /></span>
        <input type='file' id='uploadIconInput' onChange={onIconChange} className={style['file-input']} />
      </div>)
    }
    if (data) {
      const src = `data:${type};base64,${data}`
      return <div className={style['icon-box']}><img src={src} className={className} alt='' />{edit}</div>
    }
  }

  return <span className={missingIconClassName} />
}

VmIcon.propTypes = {
  icon: PropTypes.object, // see the 'icons' reducer
  showEdit: PropTypes.bool,
  className: PropTypes.string.isRequired, // either card-pf-icon or vm-detail-icon
  missingIconClassName: PropTypes.string.isRequired,
  onIconChange: PropTypes.func,
  onIconDefault: PropTypes.func,
}

export default VmIcon
