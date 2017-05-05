import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import Product from '../version'

const OvirtApiCheckFailed = ({ config }) => {
  const oVirtApiVersion = config.get('oVirtApiVersion')
  console.log(`OvirtApiCheckFailed(): ${JSON.stringify(oVirtApiVersion.toJS())}`)

  const passed = oVirtApiVersion.get('passed')
  if (passed !== false) { // if unknown, the test has not finished yet
    return null
  }

  let found = '"unknown"'
  const major = oVirtApiVersion.get('major')
  const minor = oVirtApiVersion.get('minor')
  if (major) {
    found = `${major}.${minor}`
  }

  const required = `${Product.ovirtApiVersionRequired.major}.${Product.ovirtApiVersionRequired.minor}`

  return (
    <div className='alert alert-danger'>
      <span className='pficon pficon-error-circle-o' />
      <strong>Unsupported {found} oVirt version found</strong>, but version at least {required} is required .
    </div>
  )
}
OvirtApiCheckFailed.propTypes = {
  config: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    config: state.config,
  })
)(OvirtApiCheckFailed)
