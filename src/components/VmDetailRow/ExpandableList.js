import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { msg } from 'app-intl'

import style from './style.css'

const MAX_VISIBLE_ITEMS = 2

class ExpandableList extends Component {
  constructor (props) {
    super(props)
    this.state = {
      expanded: false,
    }
  }

  render () {
    const { items, addItemComponent, noItemsTitle, idPrefix } = this.props

    const classes = style['items-list']

    let itemsToRender = items.map((item) => React.cloneElement(item, { showSettings: this.props.showSettings }))
    if (!this.state.expanded) {
      itemsToRender = itemsToRender.slice(0, MAX_VISIBLE_ITEMS)
    }

    const hasItems = items.length > 0
    const noItems = hasItems || (<dd><small>{noItemsTitle}</small></dd>)

    const showModal = this.props.showSettings && addItemComponent

    let moreLessButton = null
    const hiddenCount = items.length - MAX_VISIBLE_ITEMS
    if (hiddenCount > 0) {
      if (this.state.expanded) {
        moreLessButton = (
          <div className={style['button-more']} onClick={() => this.setState({ expanded: false })} id={`${idPrefix}-button-less`}>
            {msg.less()}
          </div>
        )
      } else {
        moreLessButton = (
          <div className={style['button-more']} onClick={() => this.setState({ expanded: true })} id={`${idPrefix}-button-more`}>
            {msg.more()} ({hiddenCount})
          </div>
        )
      }
    }

    return (
      <React.Fragment>
        {noItems}
        <div className={classes}>
          <ul className={style['items-ul']}>
            {itemsToRender}
          </ul>
          {moreLessButton}
          {showModal}
        </div>
      </React.Fragment>
    )
  }
}

ExpandableList.propTypes = {
  items: PropTypes.array.isRequired,
  noItemsTitle: PropTypes.string.isRequired,
  showSettings: PropTypes.bool,
  idPrefix: PropTypes.string.isRequired,
  addItemComponent: PropTypes.node.isRequired,
}

export default ExpandableList
