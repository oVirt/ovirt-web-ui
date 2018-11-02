import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { msg } from '../../intl'
import FieldHelp from '../FieldHelp'
import ExpandableList from './ExpandableList'

class VmDetailRow extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showSettings: false,
    }
  }

  render () {
    const { label, labelTooltip, iconClassname, editor, enableSettings, disableMessage } = this.props

    const pencilIcon = (<i className={`pficon pficon-edit`} />)

    const idPrefix = editor.props.idPrefix

    const itemOptionsShowHide = enableSettings ? (
      <small>
        <a href='#' onClick={() => this.setState((prevState) => ({ showSettings: !prevState.showSettings }))} id={`${idPrefix}-itemoptions-showhide`}>
          {pencilIcon}
        </a>
      </small>
    ) : (
      <small>
        <FieldHelp content={disableMessage || msg.notEditableForPoolsOrPoolVms()} text={pencilIcon} />
      </small>
    )

    const editorToRender = React.cloneElement(editor, { showSettings: this.state.showSettings && enableSettings })

    const iconToRender = iconClassname
      ? (<React.Fragment>
        <span className={iconClassname} />
        &nbsp;
      </React.Fragment>)
      : null

    return (
      <React.Fragment>
        <dt>
          {iconToRender}
          <FieldHelp content={labelTooltip} text={label} />
          &nbsp;
          {itemOptionsShowHide}
        </dt>
        {editorToRender}
      </React.Fragment>
    )
  }
}

VmDetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  labelTooltip: PropTypes.string.isRequired,
  iconClassname: PropTypes.string.isRequired,
  editor: PropTypes.node.isRequired,
  enableSettings: PropTypes.bool,
  disableMessage: PropTypes.string,
}

export default VmDetailRow
export { ExpandableList }
