import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import Product from '../version'
import { msg } from '../intl'
import { fixedStrings } from '../branding'
import { logDebug } from '../helpers'

const OvirtApiCheckFailed = ({ config }) => {
  const oVirtApiVersion = config.get('oVirtApiVersion')
  logDebug(`Check in OvirtApiCheckFailed(): connected to ${JSON.stringify(oVirtApiVersion.toJS())}`)

  const passed = oVirtApiVersion.get('passed')
  if (passed !== false) { // if unknown, the test has not finished yet
    return null
  }

  const major = oVirtApiVersion.get('major')
  const minor = oVirtApiVersion.get('minor')
  const version = major ? `${major}.${minor}` : `"${msg.unknown()}"`

  const required = `${Product.ovirtApiVersionRequired.major}.${Product.ovirtApiVersionRequired.minor}`

  return (
    <div className='alert alert-danger'>
      <span className='pficon pficon-error-circle-o' />
      <span dangerouslySetInnerHTML={{ __html: msg.htmlUnsupportedOvirtVersionFoundButVersionAtLeastRequired({ version, productName: fixedStrings.BRAND_NAME, requiredVersion: required }) }} />
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
