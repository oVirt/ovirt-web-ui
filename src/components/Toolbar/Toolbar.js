import React from 'react'
import PropTypes from 'prop-types'
import style from './style.css'

const Toolbar = ({ children }) => {
  let i = 0
  const tempChildren = children.map((c) => {
    i++
    return (<div key={'toolbar' + i} className={`form-group toolbar-pf-view-selector ${style['actions-padding']}`}>{c}</div>)
  })
  return (<div className='container-fluid'>
    <div className='row toolbar-pf'>
      <div className='col-sm-12'>
        <div className='toolbar-pf-actions'>
          <div className='toolbar-pf-action-right'>
            {tempChildren}
          </div>
        </div>
      </div>
    </div>
  </div>)
}

Toolbar.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Toolbar
