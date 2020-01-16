import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { addVmNic, deleteVmNic } from '_/actions'
import { Button } from 'patternfly-react'
import DeleteConfirmationModal from '../VmModals/DeleteConfirmationModal'
import { msg } from '_/intl'
import FieldHelp from '../FieldHelp'
import VmDetailRow, { ExpandableList } from '../VmDetailRow'
import { localeCompare } from '_/helpers'
import { canUserUseAnyVnicProfile } from '_/utils'

import NewNicModal from './NewNicModal'
import style from './style.css'

class VmNic extends React.Component {
  constructor (props) {
    super(props)
    this.state = { showDeleteModal: false }
    this.handleDelete = this.handleDelete.bind(this)
  }

  handleDelete () {
    this.props.onDelete({ nicId: this.props.nic.get('id') })
    this.handleClose()
  }

  render () {
    let { nic, vnicProfile, showSettings, isUp } = this.props
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
    const areYouSure = msg.areYouSureYouWantToDeleteNic({
      nicName: `"<strong>${this.props.nic.get('name')}</strong>"`,
    })

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
          { showSettings &&
            <DeleteConfirmationModal
              trigger={({ onClick }) => (
                <Button bsStyle='default' bsSize='small' disabled={isUp} onClick={onClick}>
                  {msg.delete()}
                </Button>
              )}
              onDelete={this.handleDelete}
            >
              <p dangerouslySetInnerHTML={{ __html: areYouSure }} />
              <p>{msg.thisOperationCantBeUndone()}</p>
            </DeleteConfirmationModal>
          }
        </span>
      </li>
    )
  }
}
VmNic.propTypes = {
  nic: PropTypes.object.isRequired,
  vnicProfile: PropTypes.object,
  showSettings: PropTypes.bool,
  isUp: PropTypes.bool,
  onDelete: PropTypes.func.isRequired,
}

const VmNics = function ({ nics, vnicProfiles, onNicAdd, enableSettings, onNicDelete, canUserUseAnyVnicProfile }) {
  let nextNicId = 0
  nics.forEach((value) => {
    const valueNum = value.get('name').match(/nic(\d+)/)
    const parsedIndex = valueNum !== null && parseInt(valueNum[1])
    if (parsedIndex && nextNicId <= parsedIndex) {
      nextNicId = parsedIndex + 1
    }
  })
  const nextNicName = nextNicId !== 0 ? `nic${nextNicId}` : 'nic1'

  // TODO: filter this list just like for the NicEditor in the details card
  let renderedNics = nics.sort((a, b) => localeCompare(a.get('name'), b.get('name'))).map(nic => {
    const vnicProfile = vnicProfiles.get(nic.getIn(['vnicProfile', 'id']))
    return (<VmNic nic={nic} vnicProfile={vnicProfile} key={nic.get('id')} onDelete={onNicDelete} />)
  }).toJS()

  const idPrefix = `vmnics-`

  const nicsModal = <NewNicModal vnicProfiles={vnicProfiles.filter(vnicProfile => vnicProfile.get('canUserUseProfile'))} nextNicName={nextNicName} onAdd={onNicAdd} />

  return (
    <VmDetailRow
      label={msg.nic()}
      labelTooltip={msg.nicsTooltip()}
      iconClassname='pficon pficon-container-node'
      editor={
        <ExpandableList
          items={renderedNics}
          noItemsTitle={msg.noNics()}
          addItemComponent={nicsModal}
          idPrefix={idPrefix}
        />
      }
      enableSettings={enableSettings && canUserUseAnyVnicProfile}
      disableMessage={!canUserUseAnyVnicProfile && msg.youHaveNoAllowedVnicProfiles()}
    />
  )
}

VmNics.propTypes = {
  vm: PropTypes.object.isRequired, // eslint-disable-line react/no-unused-prop-types
  nics: PropTypes.object.isRequired,
  canUserUseAnyVnicProfile: PropTypes.bool,
  vnicProfiles: PropTypes.object.isRequired,
  enableSettings: PropTypes.bool,
  onNicAdd: PropTypes.func.isRequired,
  onNicDelete: PropTypes.func.isRequired,
}

export default connect(
  (state, { vm }) => {
    const dataCenterId = state.clusters.getIn([vm.getIn(['cluster', 'id']), 'dataCenterId'])
    return {
      vnicProfiles: state.vnicProfiles.filter(vnicProfile => dataCenterId === vnicProfile.getIn(['network', 'dataCenterId'])),
      canUserUseAnyVnicProfile: canUserUseAnyVnicProfile(state.vnicProfiles, dataCenterId),
    }
  },

  (dispatch, { vm }) => ({
    onNicAdd: ({ nic }) => dispatch(addVmNic({ vmId: vm.get('id'), nic })),
    onNicDelete: ({ nicId }) => dispatch(deleteVmNic({ vmId: vm.get('id'), nicId })),
  })
)(VmNics)
