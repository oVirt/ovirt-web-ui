import React from 'react'
import { Link } from 'react-router-dom'

const AddVmButton = () => {
  return (<div>
    <Link className='btn btn-primary' to='/vm/add'>
      Add Virtual Machine
    </Link>
  </div>)
}

export default AddVmButton
