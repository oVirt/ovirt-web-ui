import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import ContainerFluid from '../ContainerFluid'
import VmUserMessages from '../VmUserMessages'
import UserMenu from './UserMenu'
import { hrefWithoutHistory } from '../../helpers'

import { refresh } from '../../actions/vm'

/**
 * Main application header on top of the page
 */
const VmsPageHeader = ({ title, onRefresh }) => {
  const titleStyle = { padding: '0px 0 5px' }

  return (
    <nav className='navbar navbar-default navbar-pf navbar-fixed-top'>
      <ContainerFluid>
        <div className='navbar-header'>
          <a className='navbar-brand' style={titleStyle} href='/'>{title}</a>
        </div>

        <ul className='nav navbar-nav navbar-utility'>
          <li>
            <a href='#' onClick={hrefWithoutHistory(onRefresh)}>
              <span className='fa fa-refresh' />&nbsp;Refresh
            </a>
          </li>

          <UserMenu />
          <VmUserMessages />
        </ul>
      </ContainerFluid>
    </nav>
  )
}
VmsPageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  page: PropTypes.number.isRequired,
  onRefresh: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({ }),
  (dispatch, { page }) => ({
    onRefresh: () => dispatch(refresh({ quiet: false, shallowFetch: false, page })),
  })
)(VmsPageHeader)
