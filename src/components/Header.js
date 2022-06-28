import React from 'react'
import PropTypes from 'prop-types'
import { resourcesUrls } from '_/branding'
import {
  Brand,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
} from '@patternfly/react-core'

const Header = ({ children }) => {
  return (
    <Masthead className='obrand_masthead' display={{ default: 'inline' }}>
      <MastheadMain>
        <MastheadBrand className='obrand_headerLogoLink' id='pageheader-logo' href="/">
          <Brand className='obrand_mastheadLogo' src={resourcesUrls.clearGif}/>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        {children}
      </MastheadContent>
    </Masthead>
  )
}

Header.propTypes = {
  children: PropTypes.node,
}

export default Header
