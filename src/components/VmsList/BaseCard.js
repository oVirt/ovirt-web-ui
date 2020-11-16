import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { Card, CardTitle, CardBody, Col } from 'patternfly-react'
import VmIcon from '../VmIcon'

import style from './style.css'

const HEADER_NAME = 'Header'
const ICON_NAME = 'Icon'
const TITLE_NAME = 'Title'
const STATUS_NAME = 'Status'

const IdPrefixContext = React.createContext('')

class BaseCardHeader extends React.Component {
  render () {
    const { children } = this.props
    return (
      <div>
        {children}
      </div>
    )
  }
}

BaseCardHeader.displayName = HEADER_NAME

BaseCardHeader.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
}

const BaseCardIcon = ({ url, icon }) => {
  const i =
    <VmIcon
      icon={icon}
      className={style['card-pf-icon']}
      missingIconClassName='fa fa-birthday-cake card-pf-icon-circle'
    />

  return (url ? <Link to={url}>{i}</Link> : i)
}

BaseCardIcon.displayName = ICON_NAME

BaseCardIcon.propTypes = {
  icon: PropTypes.object,
  url: PropTypes.string,
}

class BaseCardTitle extends React.Component {
  render () {
    const { url, name } = this.props
    if (url) {
      return (
        <Link to={url} className={style['vm-detail-link']}>
          <div className={`${style['vm-name']} ${style['crop']}`} id={`${this.context}-name`}>
            {name}
          </div>
        </Link>
      )
    }
    return (
      <div className={`${style['vm-name']} ${style['crop']}`} id={`${this.context}-name`}>
        {name}
      </div>
    )
  }
}

BaseCardTitle.displayName = TITLE_NAME
BaseCardTitle.contextType = IdPrefixContext

BaseCardTitle.propTypes = {
  name: PropTypes.string.isRequired,
  url: PropTypes.string,
}

class BaseCardStatus extends React.Component {
  render () {
    const { children } = this.props

    return (
      <div className={`${style['vm-status']}`} id={`${this.context}-status`}>
        {children}
      </div>
    )
  }
}

BaseCardStatus.displayName = STATUS_NAME
BaseCardStatus.contextType = IdPrefixContext

BaseCardStatus.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
}

const names = [HEADER_NAME, ICON_NAME, TITLE_NAME, STATUS_NAME]

/**
 * Single icon-card in the list for a VM
 */
const BaseCard = ({ children, idPrefix }) => {
  const childs = { others: [] }
  React.Children.forEach(children, child => {
    if (names.includes(child.type.displayName)) {
      childs[child.type.displayName] = child
    } else {
      childs['others'].push(child)
    }
  })
  return (
    <IdPrefixContext.Provider value={idPrefix}>
      <Col xs={12} sm={6} md={4} lg={3} id={`${idPrefix}-box`} className={style['card-box']}>
        <Card className='card-pf-view card-pf-view-select card-pf-view-single-select'>
          {childs[BaseCardHeader.displayName]}
          <CardBody>
            <div className={`card-pf-top-element ${style['card-icon']}`}>
              {childs[BaseCardIcon.displayName]}
            </div>

            <CardTitle className={`text-center ${style['status-height']}`}>
              {childs[BaseCardTitle.displayName]}
              {childs[BaseCardStatus.displayName]}
            </CardTitle>

            {childs.others}
          </CardBody>
        </Card>
      </Col>
    </IdPrefixContext.Provider>
  )
}
BaseCard.propTypes = {
  children: PropTypes.arrayOf(PropTypes.node).isRequired,
  idPrefix: PropTypes.string.isRequired,
}

BaseCard.Header = BaseCardHeader
BaseCard.Title = BaseCardTitle
BaseCard.Status = BaseCardStatus
BaseCard.Icon = BaseCardIcon

export default BaseCard
