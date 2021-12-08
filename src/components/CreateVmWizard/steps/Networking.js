import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { enumMsg, withMsg } from '_/intl'
import { generateUnique } from '_/helpers'
import { NIC_SHAPE } from '../dataPropTypes'

import {
  createNicInterfacesList,
  createVNicProfileList,
  sortNicsDisks,
  suggestNicName,
  isNicNameUnique,
  isNicNameValid,
} from '_/components/utils'

import {
  TableComposable,
  Tbody,
  Th,
  Thead,
  Td,
  Tr,
} from '@patternfly/react-table'

import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateSecondaryActions,
  HelperText,
  HelperTextItem,
  Title,
  TextInput,
  Tooltip,
} from '@patternfly/react-core'

import {
  AddCircleOIcon,
  CheckIcon,
  PencilAltIcon,
  TimesIcon,
  TrashIcon,
} from '@patternfly/react-icons/dist/esm/icons'

import style from './style.css'
import { EMPTY_VNIC_PROFILE_ID } from '_/constants'

import NicNameWithLabels from './NicNameWithLabels'
import SelectBox from '_/components/SelectBox'
import { InfoTooltip } from '_/components/tooltips'

const NIC_INTERFACE_DEFAULT = 'virtio'

const Networking = ({
  msg,
  locale,
  dataCenterId,
  cluster,
  id: idPrefix = 'create-vm-wizard-nics',
  vnicProfiles,
  nics,
  onUpdate,
}) => {
  const columnNames = {
    nicName: msg.createVmNetTableHeaderNicName(),
    vnicProfile: msg.createVmNetTableHeaderVnicProfile(),
    deviceType: msg.createVmNetTableHeaderType(),
  }
  const nicIterfaces = createNicInterfacesList(msg)
  const vnicList = createVNicProfileList(vnicProfiles, { locale, msg }, { dataCenterId, cluster })
  const translateVnic = (vnicProfileId) => vnicList.find(({ id }) => id === vnicProfileId)?.value ?? msg.createVmNetUnknownVnicProfile()
  const translateDevice = (deviceType) => deviceType ? enumMsg('NicInterface', deviceType, msg) : ''

  const nicList = sortNicsDisks([...nics], locale)

  const editInProgress = nics.find(({ underConstruction }) => underConstruction)
  const onCreateNic = () => {
    onUpdate({
      valid: false,
      create: {
        id: generateUnique('NEW_'),
        name: '',
        underConstruction: {
          name: suggestNicName(nics),
          deviceType: NIC_INTERFACE_DEFAULT,
          vnicProfileId: EMPTY_VNIC_PROFILE_ID,
        },
      },
    })
  }

  return (
    <div className={style['settings-container']} id={idPrefix}>
      { nicList.length === 0 && (
        <EmptyState variant="xl" isFullHeight>
          <EmptyStateIcon icon={AddCircleOIcon}/>
          <Title headingLevel="h4" size="lg">
            {msg.createVmNetEmptyTitle()}
          </Title>

          <EmptyStateBody>
            {msg.createVmNetEmptyInfo()}
          </EmptyStateBody>
          <EmptyStateSecondaryActions>
            <Button onClick={onCreateNic}>{msg.nicActionCreateNew()}</Button>
          </EmptyStateSecondaryActions>
        </EmptyState>
      ) }

      { nicList.length > 0 && (
        <>
          <div className={style['action-buttons']}>
            <Button isDisabled={editInProgress} onClick={onCreateNic}>
              {msg.nicActionCreateNew()}
            </Button>
          </div>
          <div className={style['nic-table']}>
            <TableComposable
              aria-label={msg.nic()}
              variant='compact'
            >
              <Thead>
                <Tr>
                  <Th>{columnNames.nicName}</Th>
                  <Th>{columnNames.vnicProfile}</Th>
                  <Th>{columnNames.deviceType}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {nicList.map(({ id, underConstruction, ...rest }) => {
                  const { name, vnicProfileId, deviceType, isFromTemplate } = underConstruction ?? rest
                  const isValid = isNicNameUnique(nicList, { name, id }) && isNicNameValid(name)
                  return (
                    <Tr key={id}>
                      <Td dataLabel={columnNames.nicName}>
                        {!underConstruction && <NicNameWithLabels {...{ id, name, isFromTemplate }} />}
                        {underConstruction && (
                          <>
                            <TextInput
                              id={`${id}-name-edit`}
                              type='text'
                              validated={isValid ? 'default' : 'error'}
                              value={name}
                              onChange={value => onUpdate({
                                valid: isValid,
                                update: {
                                  id,
                                  underConstruction: {
                                    name: value,
                                    deviceType,
                                    vnicProfileId,
                                  },
                                },
                              })}
                            />
                            {!isValid && (
                              <HelperText>
                                <HelperTextItem variant="error" hasIcon>
                                  {msg.createVmWizardNetVNICNameRules()}
                                </HelperTextItem>
                              </HelperText>
                            )}
                          </>
                        )}
                      </Td>
                      <Td dataLabel={columnNames.vnicProfile}>
                        {!underConstruction && translateVnic(vnicProfileId)}
                        {underConstruction && (
                          <SelectBox
                            id={`${id}-vnic-profile-edit`}
                            items={vnicList.map(item => ({ ...item, isDefault: item.id === EMPTY_VNIC_PROFILE_ID }))}
                            selected={ vnicProfileId}
                            onChange={value => onUpdate({
                              valid: isValid,
                              update: {
                                id,
                                underConstruction: {
                                  name,
                                  deviceType,
                                  vnicProfileId: value,
                                },
                              },
                            })}
                          />
                        )}
                      </Td>
                      <Td dataLabel={columnNames.deviceType}>
                        {!underConstruction && translateDevice(deviceType)}
                        {underConstruction && (
                          <SelectBox
                            id={`${id}-device-edit`}
                            items={nicIterfaces.map(item => ({ ...item, isDefault: item.id === NIC_INTERFACE_DEFAULT }))}
                            selected={ deviceType}
                            onChange={value => onUpdate({
                              valid: isValid,
                              update: {
                                id,
                                underConstruction: {
                                  name,
                                  deviceType: value,
                                  vnicProfileId,
                                },
                              },
                            })}
                          />
                        )}
                      </Td>
                      <Td modifier='fitContent'>
                        {[
                          !underConstruction && !isFromTemplate && {
                            ariaLabel: msg.edit(),
                            id: `${id}-edit`,
                            icon: (<PencilAltIcon/>),
                            isDisabled: editInProgress,
                            onClick: () => onUpdate({
                              valid: true,
                              update: {
                                id,
                                underConstruction: {
                                  name,
                                  deviceType,
                                  vnicProfileId,
                                },
                              },
                            }),
                          },
                          underConstruction && {
                            ariaLabel: msg.save(),
                            id: `${id}-save`,
                            icon: (<CheckIcon/>),
                            isDisabled: !isValid,
                            onClick: () => onUpdate({
                              valid: true,
                              update: {
                                id,
                                name,
                                deviceType,
                                vnicProfileId,
                                underConstruction: undefined,
                              },
                            }),
                          },
                          underConstruction && {
                            ariaLabel: msg.cancel(),
                            id: `${id}-cancel`,
                            icon: (<TimesIcon/>),
                            onClick: () => onUpdate({
                              valid: true,
                              remove: !rest.name && id,
                              update: {
                                id,
                                underConstruction: undefined,
                              },
                            }),
                          },
                          !underConstruction && !isFromTemplate && {
                            ariaLabel: msg.delete(),
                            id: `${id}-delete`,
                            icon: (<TrashIcon/>),
                            isDisabled: editInProgress,
                            onClick: () => onUpdate({ remove: id }),
                          },
                        ].filter(Boolean)
                          .map(({ ariaLabel, ...rest }) => (
                            <Tooltip key={ariaLabel} content={ariaLabel}>
                              <Button
                                variant={ButtonVariant.link}
                                aria-label={ariaLabel}
                                { ...rest}
                              />
                            </Tooltip>
                          ))}
                        { isFromTemplate && <InfoTooltip id={`${id}-info-tooltip`} tooltip={msg.createVmNetNoEditHelpMessage()}/>}
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </TableComposable>
          </div>
        </>
      ) }
    </div>
  )
}

Networking.propTypes = {
  id: PropTypes.string,
  nics: PropTypes.arrayOf(PropTypes.shape(NIC_SHAPE)).isRequired,

  clusterId: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
  dataCenterId: PropTypes.string.isRequired,

  cluster: PropTypes.object.isRequired,
  vnicProfiles: PropTypes.object.isRequired,

  onUpdate: PropTypes.func.isRequired,

  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
}

export default connect(
  (state, { clusterId }) => ({
    cluster: state.clusters.get(clusterId),
    vnicProfiles: state.vnicProfiles,
  })
)(withMsg(Networking))
