import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { addVmNic, deleteVmNic } from '../../actions'
import { Button } from 'patternfly-react'
import DeleteConfirmationModal from '../VmModals/DeleteConfirmationModal'
import { msg } from '../../intl'
import FieldHelp from '../FieldHelp'
import naturalCompare from 'string-natural-compare'
import { logError } from '../../helpers'

import NewNicModal from './NewNicModal'
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
    let { nic, vnicProfile, showSettings } = this.props
    const idPrefix = `vmnic-${nic.get('name')}`
    const nicInfoContent = (
      <div id={`${idPrefix}-nic-info`}>
        {msg.network()}: {vnicProfile.getIn(['network', 'name'])}
        <br />
        {msg.vnicProfile()}: {vnicProfile.get('name')}
      </div>
    )

    const text = (
      <span className={style['light']} id={`${idPrefix}-nic`}>
        ({vnicProfile ? `${vnicProfile.getIn(['network', 'name'])}/${vnicProfile.get('name')}` : null})
      </span>
    )

    return (
      <li>
        <span id={`${idPrefix}`}>
          <span style={{ marginRight: '5px' }}>
            {nic.get('name')}&nbsp;
            <FieldHelp
              title={msg.vnicProfile()}
              content={nicInfoContent}
              text={text}
              container={null} />
          </span>
          {
            showSettings
            ? (<Button bsStyle='default' bsSize='small' onClick={this.handleOpenDialog}>
              {msg.delete()}
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
  vnicProfile: PropTypes.object.isRequired,
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
    const { nics, vnicProfiles, onNicAdd, showSettings, onNicDelete } = this.props

    const MAX_VISIBLE_NICS = 2

    let nextNicId = 0
    nics.forEach((value) => {
      const valueNum = value.get('name').match(/nic(\d+)/)
      nextNicId = valueNum !== null && nextNicId <= parseInt(valueNum[1]) ? parseInt(valueNum[1]) + 1 : nextNicId
    })
    const nextNicName = nextNicId ? `nic${nextNicId}` : 'nic1'

    let classes = style['nics-list']

    let nicsToRender = nics.sort((a, b) => naturalCompare.caseInsensitive(a.get('name'), b.get('name')))
    if (!this.state.renderMore) {
      nicsToRender = nicsToRender.slice(0, MAX_VISIBLE_NICS)
    }

    const idPrefix = `vmnics-`

    const nicsModal = showSettings && <NewNicModal vnicProfiles={vnicProfiles} nextNicName={nextNicName} onAdd={onNicAdd} />

    let moreButton = null
    const hiddenCount = nics.size - MAX_VISIBLE_NICS
    if (hiddenCount > 0) {
      if (this.state.renderMore) {
        moreButton = (
          <div className={style['button-more']} onClick={() => this.setState({ renderMore: false })} id={`${idPrefix}-button-less`}>
            {msg.less()}
          </div>
        )
      } else {
        moreButton = (
          <div className={style['button-more']} onClick={() => this.setState({ renderMore: true })} id={`${idPrefix}-button-more`}>
            {msg.more()} ({hiddenCount})
          </div>
        )
      }
    }

    return (
      <div className={classes}>
        <ul className={style['nics-ul']}>
          {
            nicsToRender.map(nic => {
              const vnicProfile = vnicProfiles.get(nic.getIn(['vnicProfile', 'id']))
              if (!vnicProfile) {
                logError(`VNIC Profile with id (${nic.getIn(['vnicProfile', 'id'])}) is not defined.`)
                return null
              }
              return (<VmNic nic={nic} vnicProfile={vnicProfile} key={nic.get('id')} showSettings={showSettings} onDelete={onNicDelete} />)
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
  nics: PropTypes.object.isRequired,
  vnicProfiles: PropTypes.object.isRequired,
  showSettings: PropTypes.bool,
  onNicAdd: PropTypes.func.isRequired,
  onNicDelete: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    vnicProfiles: state.vnicProfiles,
  }),

  (dispatch, { vmId }) => ({
    onNicAdd: ({ nic }) => dispatch(addVmNic({ vmId, nic })),
    onNicDelete: ({ nicId }) => dispatch(deleteVmNic({ vmId, nicId })),
  })
)(VmNics)
