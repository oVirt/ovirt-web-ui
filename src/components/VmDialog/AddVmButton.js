import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Link } from 'react-router-dom'

import { getFilteredClusters } from '../utils'

import { msg } from '../../intl'

const AddVmButton = ({ id, isEnabled }) => {
  if (!isEnabled) {
    return null
  }
  return (<div id={id}>
    <Link className='btn btn-primary' to='/vm/add'>
      { msg.addNewVm() }
    </Link>
  </div>)
}
AddVmButton.propTypes = {
  id: PropTypes.string,
  isEnabled: PropTypes.boolean,
}

export default connect(
  (state) => ({
    isEnabled: !!getFilteredClusters(state.clusters).size,
  }),
  (dispatch) => ({})
)(AddVmButton)
