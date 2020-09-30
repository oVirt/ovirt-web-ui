import React, { Component } from 'react'
import PropTypes from 'prop-types'
import TableConfirmButtonsRow from 'patternfly-react/dist/js/components/Table/TableConfirmButtonsRow'
class TableInlineEditRow extends Component {
  constructor (props) {
    super(props)
    this.buttonsPosition = this.buttonsPosition.bind(this)
    this.rowHeight = undefined
  }
  buttonsPosition (window, rowDimensions) {
    const position = {}
    const modalDomElement = document.querySelectorAll('div.fade.in.modal')
    const scrolledInPx = modalDomElement.length === 1 ? modalDomElement[0].scrollTop : 0

    if (!this.rowHeight || Math.abs(this.rowHeight - rowDimensions.height) < 10) {
      this.rowHeight = rowDimensions.height
    }

    position.top = rowDimensions.y + this.rowHeight + scrolledInPx
    position.right = 75 // window.width - rowDimensions.right + 10

    console.info('button position', position)
    return position
  }
  render () {
    return <TableConfirmButtonsRow {...this.props} buttonsPosition={this.buttonsPosition} buttonsClassName={'bottom'} />
  }
}

TableInlineEditRow.shouldComponentUpdate = true

TableInlineEditRow.defaultProps = {
  ...TableConfirmButtonsRow.defaultProps,
  last: false,
}

TableInlineEditRow.propTypes = {
  /** Function that determines whether values or edit components should be rendered */
  isEditing: PropTypes.func,
  /** Confirm edit callback */
  onConfirm: PropTypes.func,
  /** Cancel edit callback */
  onCancel: PropTypes.func,
  /** Flag to indicate last row */
  last: PropTypes.bool,
  /** Row cells */
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
  /** Message text inputs for i18n */
  messages: PropTypes.shape({
    confirmButtonLabel: PropTypes.string,
    cancelButtonLabel: PropTypes.string,
  }),
}

export default TableInlineEditRow
