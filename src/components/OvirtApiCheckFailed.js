import React, { useContext } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import Product from '../version'
import { MsgContext } from '_/intl'
import { fixedStrings } from '../branding'

import { Alert } from '@patternfly/react-core'

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
  const message = msg.htmlUnsupportedOvirtVersionFoundButVersionAtLeastRequired({
    version,
    productName: fixedStrings.BRAND_NAME,
    requiredVersion: required,
  })

  return (
    <Alert isInline variant="danger" id='ovirtapi-check-failed' title={message} />
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
