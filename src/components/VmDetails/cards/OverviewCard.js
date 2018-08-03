import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { getOsHumanName, getVmIcon } from '../../utils'
import { enumMsg } from '../../../intl'

import { Media } from 'react-bootstrap'
import { FormControl } from 'patternfly-react'

import BaseCard from '../BaseCard'
import VmIcon from '../../VmIcon'
import VmStatusIcon from '../../VmStatusIcon'
import style from '../style.css'

/**
 * Overview of the VM (icon, OS type, name, state, description)
 */
const OverviewCard = ({ vm, icons, operatingSystems }) => {
  const icon = getVmIcon(icons, operatingSystems, vm)

  return (
    <BaseCard
      editTooltip={`Edit ${vm.get('id')}`}
      onCancel={() => { }}
      onSave={() => { }}
    >
      {({ isEditing }) => {
        return (
          <div>
            <div className={style['os-name-tag']}>{getOsHumanName(vm.getIn(['os', 'type']))}</div>

            <Media>
              <Media.Left>
                <VmIcon icon={icon} missingIconClassName='pficon pficon-virtual-machine' />
              </Media.Left>
              <Media.Body>
                <Media.Heading>{vm.get('name')}</Media.Heading>

                <div>
                  <VmStatusIcon state={vm.get('status')} />
                  {enumMsg('VmStatus', vm.get('status'))}
                </div>

                <div>{isEditing
                  ? (
                    <FormControl componentClass='textarea' rows='5' value={vm.get('description')} />
                  )
                  : (
                    <span>{vm.get('description')}</span>
                  )
                }</div>
              </Media.Body>
            </Media>
          </div>
        )
      }}
    </BaseCard>
  )
}
OverviewCard.propTypes = {
  vm: PropTypes.object,

  icons: PropTypes.object.isRequired,
  operatingSystems: PropTypes.object.isRequired, // deep immutable, {[id: string]: OperatingSystem}
}

export default connect(
  (state) => ({
    icons: state.icons,
    operatingSystems: state.operatingSystems,
  })
)(OverviewCard)
