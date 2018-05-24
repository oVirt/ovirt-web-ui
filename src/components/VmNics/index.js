import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { addVmNic, deleteVmNic } from '../../actions'
import { Button } from 'patternfly-react'
import DeleteConfirmationModal from '../VmModals/DeleteConfirmationModal'
import { msg } from '../../intl'
import FieldHelp from '../FieldHelp'
import naturalCompare from 'string-natural-compare'
import VmDetailRow, { ExpandableList } from '../VmDetailRow'

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
        {msg.network()}: {vnicProfile ? vnicProfile.getIn(['network', 'name']) : msg.noNetwork()}
        <br />
        {msg.vnicProfile()}: {vnicProfile ? vnicProfile.get('name') : msg.noNetwork()}
      </div>
    )

    const text = (
      <span className={style['light']} id={`${idPrefix}-nic`}>
        ({vnicProfile ? `${vnicProfile.getIn(['network', 'name'])}/${vnicProfile.get('name')}` : `${msg.noNetwork()}`})
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
  vnicProfile: PropTypes.object,
  showSettings: PropTypes.bool,
  onDelete: PropTypes.func.isRequired,
}

const VmNics = function ({ nics, vnicProfiles, onNicAdd, enableSettings, onNicDelete }) {
  let nextNicId = 0
  nics.forEach((value) => {
    const valueNum = value.get('name').match(/nic(\d+)/)
    const parsedIndex = valueNum !== null && parseInt(valueNum[1])
    if (parsedIndex && nextNicId <= parsedIndex) {
      nextNicId = parsedIndex + 1
    }
  })
  const nextNicName = nextNicId !== 0 ? `nic${nextNicId}` : 'nic1'

  let renderedNics = nics.sort((a, b) => naturalCompare.caseInsensitive(a.get('name'), b.get('name'))).map(nic => {
    const vnicProfile = vnicProfiles.get(nic.getIn(['vnicProfile', 'id']))
    return (<VmNic nic={nic} vnicProfile={vnicProfile} key={nic.get('id')} onDelete={onNicDelete} />)
  }).toJS()

  const idPrefix = `vmnics-`

  const nicsModal = <NewNicModal vnicProfiles={vnicProfiles} nextNicName={nextNicName} onAdd={onNicAdd} />

  return (
    <VmDetailRow
      label={msg.nic()}
      labelTooltip={msg.nicsTooltip()}
      iconClassname='pficon pficon-container-node'
      editor={<ExpandableList items={renderedNics} noItemsTitle={msg.noNics()} addItemComponent={nicsModal} idPrefix={idPrefix} />}
      enableSettings={enableSettings}
    />
  )
}

VmNics.propTypes = {
  vmId: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
  nics: PropTypes.object.isRequired,
  vnicProfiles: PropTypes.object.isRequired,
  enableSettings: PropTypes.bool,
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
