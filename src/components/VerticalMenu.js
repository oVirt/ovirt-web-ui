import React, { PropTypes } from 'react'
import { Link } from 'react-router-dom'
import style from './sharedStyle.css'

const VerticalMenu = ({ menuItems }) => {
  const itemsComponents = menuItems.map((item, index) => {
    let icon = null
    if (item.icon !== undefined) {
      icon = (<span className={item.icon} key={item.icon} data-toggle='tooltip' title='' data-original-title={item.title} />)
    }
    return (<li className='list-group-item' key={item.title}>
      <Link to={item.to}>
        {icon}
        <span className='list-group-item-value'>{item.title}</span>
      </Link>
    </li>)
  })
  return (<div className={`nav-pf-vertical nav-pf-vertical-with-sub-menus nav-pf-persistent-secondary ${style['vertical-menu']}`}>
    <ul className='list-group'>
      {itemsComponents}
    </ul>
  </div>)
}

VerticalMenu.propTypes = {
  menuItems: PropTypes.array.isRequired,
}

export default VerticalMenu
