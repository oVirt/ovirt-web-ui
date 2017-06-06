import $ from 'jquery'
import React from 'react'
import PropTypes from 'prop-types'

import ReactDOM from 'react-dom'

class VmYesNoModal extends React.Component {

  componentDidMount () {
    const dom = ReactDOM.findDOMNode(this)
    $(dom).modal('show')
    $(dom).on('hidden.bs.modal', function (e) {
      this.props.onClose()
    }.bind(this))
  }

  render () {
    return (
      <div className='modal fade' tabIndex='-1' role='dialog'>
        <div className='modal-dialog' role='document'>
          <div className='modal-content'>
            <div className='modal-header'>
              <button type='button' className='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button>
              <h4 className='modal-title'>{this.props.title}</h4>
            </div>
            <div className='modal-body'>
              <p>{this.props.body}</p>
            </div>
            <div className='modal-footer'>
              <button type='button' onClick={this.props.onYes} className='btn btn-default' data-dismiss='modal'>Yes</button>
              <button type='button' onClick={this.props.onNo} className='btn btn-danger' data-dismiss='modal'>No</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

VmYesNoModal.propTypes = {
  title: PropTypes.string.isRequired,
  body: PropTypes.string.isRequired,
  onYes: PropTypes.func.isRequired,
  onNo: PropTypes.func,
  onClose: PropTypes.func.isRequired,
}

export default VmYesNoModal
