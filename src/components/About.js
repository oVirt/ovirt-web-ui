import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withMsg } from '_/intl'

import { Modal } from 'patternfly-react'
import Product from '../version'
import { fixedStrings } from '../branding'

const LegalInfo = () => {
  const idPrefix = `about-legal`
  if (fixedStrings.LEGAL_INFO_LINK_TEXT && fixedStrings.LEGAL_INFO_LINK_URL) {
    return (
      <div className='trademark-pf' id={`${idPrefix}-trademark`}>
        {fixedStrings.LEGAL_INFO}&nbsp;
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
    const { oVirtApiVersion, msg } = this.props
    const idPrefix = `about`

    const webUiVersionText = msg.aboutDialogVersion({
      version: `<strong id='${idPrefix}-version-value'>${Product.version}-${Product.release}</strong>`,
    })

    let apiVersion = 'unknown'
    if (oVirtApiVersion && oVirtApiVersion.get('major')) {
      apiVersion = `${oVirtApiVersion.get('major')}.${oVirtApiVersion.get('minor')}`
    }
    const apiVersionText = msg.aboutDialogApiVersion({
      brandName: fixedStrings.BRAND_NAME,
      version: `<strong id='${idPrefix}-apiversion-value'>${apiVersion}</strong>`,
    })

    const trackText = fixedStrings.ISSUES_TRACKER_TEXT || 'Github Issue Tracker'
    const trackUrl = fixedStrings.ISSUES_TRACKER_URL || 'https://github.com/oVirt/ovirt-web-ui/issues'
    const reportLink = msg.aboutDialogReportIssuesLink({
      link: `<a href='${trackUrl}' target='_blank' id='${idPrefix}-issues-link'><strong>${trackText}</strong></a>`,
    })

    const docLink = msg.aboutDialogDocumentationLink({
      link: `<a href='${fixedStrings.DOCUMENTATION_LINK}' target='_blank' id='${idPrefix}-documentation-link'><strong>${msg.aboutDialogDocumentationText()}</strong></a>`,
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
              <h1 id={`${idPrefix}-title`}>{fixedStrings.BRAND_NAME} {msg.vmPortal()}</h1>
              <div className='product-versions-pf'>
                <ul className='list-unstyled'>
                  <li id={`${idPrefix}-version`}>
                    <div dangerouslySetInnerHTML={{ __html: webUiVersionText }} />
                  </li>
                  <li id={`${idPrefix}-apiversion`}>
                    <div dangerouslySetInnerHTML={{ __html: apiVersionText }} />
                  </li>
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
  msg: PropTypes.object,
}

export default connect(
  (state) => ({
    oVirtApiVersion: state.config.get('oVirtApiVersion'),
  })
)(withMsg(AboutDialog))
