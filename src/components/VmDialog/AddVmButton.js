import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import { openAddVmDialog } from '../../actions/index'

const AddVmButton = ({ name, toggleDialog }) => (
  <div>
    <button
      width='100%'
      type='button'
      className='btn btn-primary'
      onClick={toggleDialog}>
      <span className='pfincon pficon pficon-add-circle-o' />&nbsp;{name}
    </button>
  </div>
)

AddVmButton.propTypes = {
  name: PropTypes.string.isRequired,
  toggleDialog: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({}),
  (dispatch) => ({
    toggleDialog: () =>
      dispatch(openAddVmDialog()),
  })
)(AddVmButton)
