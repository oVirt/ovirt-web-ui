import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { hrefWithoutHistory } from '_/helpers'
import { MsgContext } from '_/intl'
import { Tooltip } from '../tooltips'

const Bellicon = ({ userMessages, handleclick }) => {
  const { msg } = useContext(MsgContext)
  const messagesCount = userMessages.get('records').size
  const idPrefix = `usermsgs`
  const badgeElement = messagesCount === 0
    ? null
    : <span className='badge' id={`${idPrefix}-size`}>{messagesCount}</span>

  return (
    <li>
      <Tooltip id={`${idPrefix}-tooltip`} tooltip={msg.notifications()} placement='bottom'>
        <a className='dropdown-toggle nav-item-iconic' href='#' onClick={hrefWithoutHistory(handleclick)} id={`${idPrefix}-toggle`}>
          <i className='fa fa-bell' />
          {badgeElement}
          <span className='caret' id={`${idPrefix}-caret`} />
        </a>
      </Tooltip>
    </li>
  )
}
Bellicon.propTypes = {
  handleclick: PropTypes.func.isRequired,
  userMessages: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    userMessages: state.userMessages,
  })
)(Bellicon)
