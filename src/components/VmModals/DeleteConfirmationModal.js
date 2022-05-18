import React from 'react'
import PropTypes from 'prop-types'
import { withMsg } from '_/intl'
import ConfirmationModal from '../VmActions/ConfirmationModal'

class DeleteConfirmationModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = { show: false }
    this.handleTriggerClick = this.handleTriggerClick.bind(this)
    this.handleClose = this.handleClose.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
  }

  handleTriggerClick (e) {
    e.preventDefault()
    this.setState({ show: true })
  }

  handleClose () {
    this.setState({ show: false })
    this.props.onClose && this.props.onClose()
  }

  handleDelete () {
    this.setState({ show: false })
    this.props.onDelete()
  }

  render () {
    const {
      children,
      trigger,
      id,
      severity = 'normal',
      title,
      msg,
    } = this.props

    const variant = severity === 'normal' ? 'warning' : 'danger'

    return (
      <>
        { trigger({ onClick: this.handleTriggerClick }) }
        <ConfirmationModal
          id={id}
          show={this.state.show}
          onClose={this.handleClose}
          title={title || msg.confirmDelete()}
          body={children}
          variant={variant}
          confirm={{ onClick: this.handleDelete, title: msg.delete(), type: variant }}
        />
      </>
    )
  }
}

DeleteConfirmationModal.propTypes = {
  id: PropTypes.string.isRequired,
  trigger: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  severity: PropTypes.oneOf(['normal', 'danger']),
  title: PropTypes.string,
  msg: PropTypes.object.isRequired,
}

export default withMsg(DeleteConfirmationModal)
