import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import Product from '../version'
import { MsgContext } from '_/intl'
import { fixedStrings } from '../branding'
import ErrorAlert from './ErrorAlert'

const OvirtApiCheckFailed = ({ config }) => {
  const { msg } = useContext(MsgContext)
  const oVirtApiVersion = config.get('oVirtApiVersion')

  const passed = oVirtApiVersion.get('passed')
  if (passed !== false) { // if unknown, the test has not finished yet
    return null
  }

  console.info(`OvirtApiCheckFailed(): ${JSON.stringify(oVirtApiVersion.toJS())}`)

  const major = oVirtApiVersion.get('major')
  const minor = oVirtApiVersion.get('minor')
  const version = major ? `${major}.${minor}` : `"${msg.unknown()}"`

  const required = `${Product.ovirtApiVersionRequired.major}.${Product.ovirtApiVersionRequired.minor}`
  const htmlMessage = msg.htmlUnsupportedOvirtVersionFoundButVersionAtLeastRequired({
    version,
    productName: fixedStrings.BRAND_NAME,
    requiredVersion: required,
  })
  const message = (<span dangerouslySetInnerHTML={{ __html: htmlMessage }} />)

  return (
    <ErrorAlert id='ovirtapi-check-failed'>{message}</ErrorAlert>
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
