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

const BaseCardHeader = ({ children }) => (
  <div>
    {children}
  </div>
)

BaseCardHeader.displayName = HEADER_NAME

BaseCardHeader.contextType = IdPrefixContext
BaseCardHeader.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
}

const BaseCardIcon = ({ url, icon }) => (
  url
    ? <Link to={url}>
      <VmIcon icon={icon} className={style['card-pf-icon']}
        missingIconClassName='fa fa-birthday-cake card-pf-icon-circle' />
    </Link>
    : <VmIcon icon={icon} className={style['card-pf-icon']}
      missingIconClassName='fa fa-birthday-cake card-pf-icon-circle' />
)

BaseCardIcon.displayName = ICON_NAME

BaseCardIcon.propTypes = {
  icon: PropTypes.object.isRequired,
  url: PropTypes.string,
}

const BaseCardTitle = ({ url, name }, context) => (
  url
    ? <Link to={url} className={style['vm-detail-link']}>
      <p className={`${style['vm-name']} ${style['crop']}`} title={name} data-toggle='tooltip' id={`${context}-name`}>
        {name}
      </p>
    </Link>
    : <p className={`${style['vm-name']} ${style['crop']}`} title={name} data-toggle='tooltip' id={`${context}-name`}>
      {name}
    </p>
)

BaseCardTitle.displayName = TITLE_NAME

BaseCardTitle.contextType = IdPrefixContext
BaseCardTitle.propTypes = {
  name: PropTypes.string.isRequired,
  url: PropTypes.string,
}

const BaseCardStatus = ({ children }, context) => (
  <p className={`${style['vm-status']}`} id={`${context}-status`}>
    {children}
  </p>
)

BaseCardStatus.displayName = STATUS_NAME

BaseCardStatus.contextType = IdPrefixContext
BaseCardStatus.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
}

const names = [ HEADER_NAME, ICON_NAME, TITLE_NAME, STATUS_NAME ]

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
      <Col xs={12} sm={6} md={4} lg={3} id={`${idPrefix}-box`}>
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
