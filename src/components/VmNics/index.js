import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { addVmNic, deleteVmNic } from '../../actions'
import { Button } from 'patternfly-react'
import DeleteConfirmationModal from '../VmModals/DeleteConfirmationModal'
import { msg } from '../../intl'

import NicsModal from './NicsModal'
import style from './style.css'

class VmNic extends React.Component {
  constructor (props) {
    super(props)
    this.state = { showDeleteModal: false }
    this.handleOpenDialog = this.handleOpenDialog.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  handleOpenDialog () {
    this.setState({ showDeleteModal: true })
  }

  handleDelete () {
    this.props.onDelete({ nicId: this.props.nic.get('id') })
    this.handleClose()
  }

  handleClose () {
    this.setState({ showDeleteModal: false })
  }

  render () {
    let { nic, vnicProfile, network, showSettings } = this.props
    const idPrefix = `vmnic-${nic.get('name')}`

    return (
      <li>
        <span id={`${idPrefix}`}>
          <span style={{ marginRight: '5px' }}>
            {nic.get('name')}&nbsp;
            {vnicProfile ? `${network.get('name')}/${vnicProfile.get('name')}` : null}
          </span>
          {
            showSettings
            ? (<Button bsStyle='default' bsSize='small' onClick={this.handleOpenDialog}>
                Delete
            </Button>)
            : null
          }
          <DeleteConfirmationModal show={this.state.showDeleteModal} onDelete={this.handleDelete} onClose={this.handleClose}>
            <p dangerouslySetInnerHTML={{ __html: msg.areYouSureYouWantToDeleteNic({ nicName: `"<strong>${this.props.nic.get('name')}</strong>"` }) }} />
            <p>{msg.thisOperationCantBeUndone()}</p>
          </DeleteConfirmationModal>
        </span>
      </li>
    )
  }
}
VmNic.propTypes = {
  nic: PropTypes.object.isRequired,
  vnicProfile: PropTypes.object,
  network: PropTypes.object,
  showSettings: PropTypes.bool,
  onDelete: PropTypes.func.isRequired,
}

class VmNics extends Component {
  constructor (props) {
    super(props)
    this.state = {
      renderMore: false,
    }
  }

  render () {
    const { nics, vnicProfiles, networks, onNicAdd, showSettings, onNicDelete } = this.props

    const nextNicId = nics.count((value) => value.get('name').match(/nic\d+/) !== null) + 1
    let nextNicName = 'nic1'

    if (nextNicId) {
      nextNicName = `nic${nextNicId}`
    }

    let classes = style['nics-list']

    let nicsToRender = nics.sort((a, b) => a.get('name').localeCompare(b.get('name')))
    if (!this.state.renderMore) {
      nicsToRender = nicsToRender.slice(0, 2)
    }

    const idPrefix = `vmnics-`

    let nicsModal = null

    if (showSettings) {
      nicsModal = (<NicsModal vnicProfiles={vnicProfiles} networks={networks} nextNicName={nextNicName} onAdd={onNicAdd} />)
    }

    let moreButton = null
    const hiddenCount = nics.size - 2
    if (hiddenCount > 0) {
      if (this.state.renderMore) {
        moreButton = (
          <div className={style['button-more']} onClick={() => this.setState({ renderMore: false })} id={`${idPrefix}-button-less`}>
            less
          </div>
        )
      } else {
        moreButton = (
          <div className={style['button-more']} onClick={() => this.setState({ renderMore: true })} id={`${idPrefix}-button-more`}>
            more ({hiddenCount})
          </div>
        )
      }
    }

    return (
      <div className={classes}>
        <ul className={style['nics-ul']}>
          {
            nicsToRender.map(nic => {
              const vnicProfile = vnicProfiles.getIn(['vnicProfiles', nic.getIn(['vnicProfile', 'id'])])
              const network = vnicProfile.size && networks.getIn(['networks', vnicProfile.getIn(['network', 'id'])])
              return (<VmNic nic={nic} vnicProfile={vnicProfile} network={network} key={nic.get('id')} showSettings={showSettings} onDelete={onNicDelete} />)
            })
          }

        </ul>
        {moreButton}
        {nicsModal}
      </div>
    )
  }
}
VmNics.propTypes = {
  vmId: PropTypes.string.isRequired,
  nics: PropTypes.object,
  vnicProfiles: PropTypes.object,
  showSettings: PropTypes.bool,
  networks: PropTypes.object,
  onNicAdd: PropTypes.func.isRequired,
  onNicDelete: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    vnicProfiles: state.vnicProfiles,
    networks: state.networks,
  }),

  (dispatch, { vmId }) => ({
    onNicAdd: ({ nic }) => dispatch(addVmNic({ vmId, nic })),
    onNicDelete: ({ nicId }) => dispatch(deleteVmNic({ vmId, nicId })),
  })
)(VmNics)
