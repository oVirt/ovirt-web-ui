import React from 'react'
import PropTypes from 'prop-types'
import { resourcesUrls } from '_/branding'

const Header = ({ children }) => {
  return (
    <nav className='navbar obrand_mastheadBackground obrand_topBorder navbar-pf-vertical'>
      <div className='navbar-header'>
        <a href='/' className='navbar-brand obrand_headerLogoLink' id='pageheader-logo'>
          <img className='obrand_mastheadLogo' src={resourcesUrls.clearGif} />
        </a>
      </div>
      {children}
    </nav>
  )
}

Header.propTypes = {
  children: PropTypes.node,
}

export default Header
