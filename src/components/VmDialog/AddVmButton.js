import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { Link } from 'react-router-dom'

import { msg } from 'app-intl'

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
  isEnabled: PropTypes.bool,
}

export default connect(
  (state) => ({
    isEnabled: state.clusters.find(cluster => cluster.get('canUserUseCluster')) !== undefined,
  }),
  (dispatch) => ({})
)(AddVmButton)
