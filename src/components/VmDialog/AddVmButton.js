import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import { msg } from '../../intl'

const AddVmButton = ({ id }) => {
  return (<div id={id}>
    <Link className='btn btn-primary' to='/vm/add'>
      { msg.addNewVm() }
    </Link>
  </div>)
}
AddVmButton.propTypes = {
  id: PropTypes.string,
}

export default AddVmButton
