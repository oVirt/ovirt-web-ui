import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Icon } from 'patternfly-react'

import VmUserMessages from '../VmUserMessages'
import Bellicon from '../VmUserMessages/Bellicon'
import UserMenu from './UserMenu'
import Header from '../Header'
import { hrefWithoutHistory } from '_/helpers'

import { manualRefresh } from '_/actions'
import { MsgContext } from '_/intl'
import { Tooltip } from '../tooltips'

/**
 * Main application header on top of the page
 */
const VmsPageHeader = ({ onRefresh }) => {
  const { msg } = useContext(MsgContext)
  const [show, setShow] = useState(false)
  const idPrefix = `pageheader`

  return (
    <Header>
      <div className='collapse navbar-collapse'>
        <VmUserMessages show={show} onClose={() => setShow(!show)} />
        <ul className='nav navbar-nav navbar-right navbar-iconic'>
          <li>
            <Tooltip id={`${idPrefix}-tooltip`} tooltip={msg.refresh()} placement='bottom'>
              <a href='#' className='nav-item-iconic' onClick={hrefWithoutHistory(() => onRefresh())} id={`${idPrefix}-refresh`}>
                <i className='fa fa-refresh' />
              </a>
            </Tooltip>
          </li>
          <li>
            <Tooltip id={`${idPrefix}-tooltip`} tooltip={msg.accountSettings()} placement='bottom'>
              <Link to='/settings' className='nav-item-iconic'>
                <Icon
                  name='cog'
                  type='fa'
                />
              </Link>
            </Tooltip>
          </li>
          <UserMenu />
          <Bellicon handleclick={() => setShow(!show)} />
        </ul>
      </div>
    </Header>
  )
}
VmsPageHeader.propTypes = {
  onRefresh: PropTypes.func.isRequired,
}

export default connect(
  null,
  (dispatch) => ({
    onRefresh: () => dispatch(manualRefresh()),
  })
)(VmsPageHeader)
