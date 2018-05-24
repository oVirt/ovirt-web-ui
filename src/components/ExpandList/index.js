import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { msg } from '../../intl'
import FieldHelp from '../FieldHelp'

import style from './style.css'

const MAX_VISIBLE_ITEMS = 2

class ExpandList extends Component {
  constructor (props) {
    super(props)
    this.state = {
      renderMore: false,
      showSettings: false,
    }
  }

  render () {
    const { items, title, addItemComponent, enableSettings, noItemsTitle, idPrefix } = this.props

    const classes = style['items-list']
    const pencilIcon = (<i className={`pficon pficon-edit`} />)

    let itemsToRender = items.map((item) => React.cloneElement(item, { showSettings: this.state.showSettings && enableSettings }))
    if (!this.state.renderMore) {
      itemsToRender = itemsToRender.slice(0, MAX_VISIBLE_ITEMS)
    }

    const hasItems = items.length > 0
    const noItems = hasItems || (<dd><small>{noItemsTitle}</small></dd>)

    const showModal = this.state.showSettings && enableSettings && addItemComponent

    const itemOptionsShowHide = enableSettings ? (
      <small>
        <a href='#' onClick={() => this.setState((prevState) => ({ showSettings: !prevState.showSettings }))} id={`${idPrefix}-itemoptions-showhide`}>
          {pencilIcon}
        </a>
      </small>
    ) : (
      <small>
        <FieldHelp content={msg.notEditableForPoolsOrPoolVms()} text={pencilIcon} />
      </small>
    )

    let moreButton = null
    const hiddenCount = items.length - MAX_VISIBLE_ITEMS
    if (hiddenCount > 0) {
      if (this.state.renderMore) {
        moreButton = (
          <div className={style['button-more']} onClick={() => this.setState({ renderMore: false })} id={`${idPrefix}-button-less`}>
            {msg.less()}
          </div>
        )
      } else {
        moreButton = (
          <div className={style['button-more']} onClick={() => this.setState({ renderMore: true })} id={`${idPrefix}-button-more`}>
            {msg.more()} ({hiddenCount})
          </div>
        )
      }
    }

    return (
      <React.Fragment>
        <dt>
          {title}
          &nbsp;
          {itemOptionsShowHide}
        </dt>
        {noItems}
        <div className={classes}>
          <ul className={style['items-ul']}>
            {itemsToRender}
          </ul>
          {moreButton}
          {showModal}
        </div>
      </React.Fragment>
    )
  }
}
ExpandList.propTypes = {
  items: PropTypes.array.isRequired,
  noItemsTitle: PropTypes.string.isRequired,
  enableSettings: PropTypes.bool,
  idPrefix: PropTypes.string.isRequired,
  title: PropTypes.node.isRequired,
  addItemComponent: PropTypes.node.isRequired,
}

export default ExpandList
