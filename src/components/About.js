import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import Product from '../version'
import { fixedStrings } from '../branding'

const LegalInfo = () => {
  const idPrefix = `about-legal`
  if (fixedStrings.LEGAL_INFO_LINK_TEXT && fixedStrings.LEGAL_INFO_LINK_URL) {
    return (
      <div className='trademark-pf' id={`${idPrefix}-trademark`}>
        {fixedStrings.LEGAL_INFO} &nbsp;
        <a href={fixedStrings.LEGAL_INFO_LINK_URL} target='_blank' id={`${idPrefix}-link`}>{fixedStrings.LEGAL_INFO_LINK_TEXT}</a>
      </div>
    )
  }
  return (
    <div className='trademark-pf' id={`${idPrefix}-trademark`}>
      {fixedStrings.LEGAL_INFO}
    </div>
  )
}

const AboutDialog = ({ oVirtApiVersion }) => {
  // TODO: link documentation: https://github.com/oVirt/ovirt-web-ui/issues/134
  // TODO: oVirt API version

  const idPrefix = `about`

  let apiVersion = 'unknown'
  if (oVirtApiVersion && oVirtApiVersion.get('major')) {
    apiVersion = `${oVirtApiVersion.get('major')}.${oVirtApiVersion.get('minor')}`
    console.log(apiVersion)
  }

  return (
    <div className='modal fade' id='about-modal' tabIndex='-1' role='dialog' aria-labelledby='myModalLabel' aria-hidden='true'>
      <div className='modal-dialog'>
        <div className='modal-content about-modal-pf obrand_aboutBackground'>
          <div className='modal-header'>
            <button type='button' className='close' data-dismiss='modal' aria-hidden='true' id={`${idPrefix}-close`}>
              <span className='pficon pficon-close' />
            </button>
          </div>
          <div className='modal-body'>
            <h1 id={`${idPrefix}-title`}>{fixedStrings.BRAND_NAME} VM Portal</h1>
            <div className='product-versions-pf'>
              <ul className='list-unstyled'>
                <li id={`${idPrefix}-version`}>Version <strong id={`${idPrefix}-version-value`}>{Product.version}-{Product.release}</strong></li>
                <li id={`${idPrefix}-apiversion`}>{fixedStrings.BRAND_NAME} API Version <strong id={`${idPrefix}-apiversion-value`}>{apiVersion}</strong></li>
                <li id={`${idPrefix}-issues`}>Please report issues on <strong><a href='https://github.com/oVirt/ovirt-web-ui/issues' target='_blank' id={`${idPrefix}-issues-link`}>GitHub Issue Tracker</a></strong></li>
              </ul>
            </div>

            <LegalInfo />

          </div>
          <div className='modal-footer'>
            <div className='obrand_aboutApplicationLogo' id={`${idPrefix}-applogo`} />
          </div>
        </div>
      </div>
    </div>
  )
}
AboutDialog.propTypes = {
  oVirtApiVersion: PropTypes.object,
}

export default connect(
  (state) => ({
    oVirtApiVersion: state.config.get('oVirtApiVersion'),
  })
)(AboutDialog)
