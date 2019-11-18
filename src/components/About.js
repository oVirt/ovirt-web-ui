import React from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'

import { msg } from '_/intl'

import { Modal } from 'patternfly-react'
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

class AboutDialog extends React.Component {
  constructor (props) {
    super(props)
    this.state = { openModal: false }
  }
  render () {
    // TODO: link documentation: https://github.com/oVirt/ovirt-web-ui/issues/134
    // TODO: oVirt API version

    const { oVirtApiVersion } = this.props
    const idPrefix = `about`
    const trackText = fixedStrings.ISSUES_TRACKER_TEXT || 'Github Issue Tracker'
    const trackUrl = fixedStrings.ISSUES_TRACKER_URL || 'https://github.com/oVirt/ovirt-web-ui/issues'
    const reportLink = msg.aboutDialogReportIssuesLink({
      link: `<strong><a href='${trackUrl}' target='_blank' id='${idPrefix}-issues-link'>${trackText}</a></strong>`,
    })

    let apiVersion = 'unknown'
    if (oVirtApiVersion && oVirtApiVersion.get('major')) {
      apiVersion = `${oVirtApiVersion.get('major')}.${oVirtApiVersion.get('minor')}`
    }

    const docLink = msg.aboutDialogDocumentationLink({
      link: `<strong><a href='${fixedStrings.DOCUMENTATION_LINK}' target='_blank' id='${idPrefix}-documentation-link'>${msg.aboutDialogDocumentationText()}</a></strong>`,
    })

    return (
      <React.Fragment>
        <a href='#' id='about-modal' onClick={() => this.setState({ openModal: true })}>{msg.about()}</a>
        { this.state.openModal &&
          <Modal id={`${idPrefix}-modal`} contentClassName='about-modal-pf obrand_aboutBackground' onHide={() => this.setState({ openModal: false })} show>
            <Modal.Header>
              <Modal.CloseButton onClick={() => this.setState({ openModal: false })} />
            </Modal.Header>
            <Modal.Body>
              <h1 id={`${idPrefix}-title`}>{fixedStrings.BRAND_NAME} VM Portal</h1>
              <div className='product-versions-pf'>
                <ul className='list-unstyled'>
                  <li id={`${idPrefix}-version`}>Version <strong id={`${idPrefix}-version-value`}>{Product.version}-{Product.release}</strong></li>
                  <li id={`${idPrefix}-apiversion`}>{fixedStrings.BRAND_NAME} API Version <strong id={`${idPrefix}-apiversion-value`}>{apiVersion}</strong></li>
                  <li id={`${idPrefix}-issues`}>Please report issues on <strong><a href='https://github.com/oVirt/ovirt-web-ui/issues' target='_blank' id={`${idPrefix}-issues-link`}>GitHub Issue Tracker</a></strong></li>
                  {fixedStrings.DOCUMENTATION_LINK &&
                    <li id={`${idPrefix}-documentation`}>
                      <span dangerouslySetInnerHTML={{ __html: docLink }} />
                    </li>
                  }
                  <li id={`${idPrefix}-issues`}>
                    <div dangerouslySetInnerHTML={{ __html: reportLink }} />
                  </li>
                </ul>
              </div>

              <LegalInfo />
            </Modal.Body>
            <Modal.Footer>
              <div className='obrand_aboutApplicationLogo' id={`${idPrefix}-applogo`} />
            </Modal.Footer>
          </Modal>
        }
      </React.Fragment>
    )
  }
}
AboutDialog.propTypes = {
  oVirtApiVersion: PropTypes.object,
}

export default connect(
  (state) => ({
    oVirtApiVersion: state.config.get('oVirtApiVersion'),
  })
)(AboutDialog)
