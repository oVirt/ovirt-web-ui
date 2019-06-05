import React from 'react'
import PropTypes from 'prop-types'
import style from './style.css'

const Toolbar = ({ children, isFullWidth }) => {
  let i = 0
  const actions = children.map((c) => {
    return (<div key={'toolbar' + i++} className={`form-group toolbar-pf-view-selector ${style['actions-padding']} ${isFullWidth && style['full-width']}`}>{c}</div>)
  })

  return (<div className={`container-fluid ${style['toolbar']}`}>
    <div className='row toolbar-pf'>
      <div className='col-sm-12'>
        <div className='toolbar-pf-actions'>
          <div className={`toolbar-pf-action-right toolbar-pf-height-shim ${isFullWidth && style['full-width']}`}>
            {actions}
          </div>
        </div>
      </div>
    </div>
  </div>)
}

Toolbar.propTypes = {
  children: PropTypes.node.isRequired,
  isFullWidth: PropTypes.bool,
}

export default Toolbar
