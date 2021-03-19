import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Button } from 'patternfly-react'

import * as Actions from '_/actions'
import { CREATE_PAGE_TYPE } from '_/constants'
import { withMsg } from '_/intl'
import CreateVmWizard from './CreateVmWizard'

class AddVmButton extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      showCreateWizard: false,
    }

    this.closeCreateWizard = this.closeCreateWizard.bind(this)
    this.openCreateWizard = this.openCreateWizard.bind(this)
  }

  openCreateWizard () {
    this.setState({
      showCreateWizard: true,
      previousPageType: this.props.config.get('currentPage').type,
    })
    this.props.changePage(CREATE_PAGE_TYPE)
  }

  closeCreateWizard () {
    this.props.changePage(this.state.previousPageType)
    this.setState({ showCreateWizard: false })
  }

  render () {
    const { id, isEnabled, msg } = this.props

    if (!isEnabled) {
      return null
    }

    return (
      <React.Fragment>
        <Button
          id={`${id}-button`}
          bsStyle='primary'
          onClick={this.openCreateWizard}
        >
          {msg.addNewVm()}
        </Button>

        <CreateVmWizard
          id={`${id}-wizard`}
          show={this.state.showCreateWizard}
          onHide={this.closeCreateWizard}
        />
      </React.Fragment>
    )
  }
}

AddVmButton.propTypes = {
  id: PropTypes.string,
  isEnabled: PropTypes.bool,

  config: PropTypes.object.isRequired,
  changePage: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    isEnabled: state.clusters.find(cluster => cluster.get('canUserUseCluster')) !== undefined,
    config: state.config,
  }),
  (dispatch) => ({
    changePage: (pageType) => dispatch(Actions.changePage({ type: pageType })),
  })
)(withMsg(AddVmButton))
