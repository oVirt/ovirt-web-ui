import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withMsg } from '_/intl'
import { isNumber, convertValue } from '_/utils'
import { generateUnique } from '_/helpers'
import { BASIC_DATA_SHAPE, STORAGE_SHAPE } from '../dataPropTypes'

import {
  createDiskTypeList,
  createStorageDomainList,
  sortNicsDisks,
  suggestDiskName,
  isDiskNameValid,
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
  Checkbox,
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
  InfoCircleIcon,
  PencilAltIcon,
  TimesIcon,
  TrashIcon,
} from '@patternfly/react-icons/dist/esm/icons'

import style from './style.css'

import DiskNameWithLabels from './DiskNameWithLabels'
import SelectBox from '_/components/SelectBox'
import { InfoTooltip } from '_/components/tooltips'

const Storage = ({
  msg,
  locale,
  dataCenterId,
  cluster,
  id: idPrefix = 'create-vm-wizard-nics',
  onUpdate,

  vmName,
  optimizedFor,
  disks,

  clusterId,
  storageDomains,
  maxDiskSizeInGiB,
  minDiskSizeInGiB,
}) => {
  const columnNames = {
    name: msg.createVmStorageTableHeaderName(),
    size: msg.createVmStorageTableHeaderSize(),
    storageDomain: msg.createVmStorageTableHeaderStorageDomain(),
    // disk type (thin/sparse/cow vs preallocated/raw)
    diskType: msg.createVmStorageTableHeaderType(),
  }

  const allStorageDomains = createStorageDomainList({ storageDomains, locale, msg })
  const dataCenterStorageDomainsList = createStorageDomainList({ storageDomains, dataCenterId, locale, msg })
  const editInProgress = disks.find(({ underConstruction }) => underConstruction)
  const enableCreate = dataCenterStorageDomainsList.length > 0 && !editInProgress

  // return true if the VM has any template disks that are set bootable
  const isBootableDiskTemplate = () => disks.filter(disk => disk.isFromTemplate && disk.bootable).length > 0

  const isValidDiskSize = (size) => isNumber(size) && size >= minDiskSizeInGiB && size <= maxDiskSizeInGiB

  // set appropriate tooltip message regarding setting bootable flag
  const bootableInfo = (isActualDiskBootable) => {
    const bootableDisk = disks.find(disk => disk.bootable)

    if (isBootableDiskTemplate()) {
      // template based disk cannot be edited so bootable flag cannot be removed from it
      return msg.createVmStorageNoEditBootableMessage({ diskName: bootableDisk.name })
    } else if (bootableDisk && !isActualDiskBootable) {
      // actual bootable disk isn't template based or the disk which is being edited, moving bootable flag from the bootable disk allowed
      return msg.diskEditorBootableChangeMessage({ diskName: bootableDisk.name })
    }

    // no any bootable disk yet (or the disk which is being edited is bootable but not a template disk), adding/editing bootable flag allowed
    return msg.createVmStorageBootableMessage()
  }

  const isSdOk = ({ storageDomainId, canUserUseStorageDomain }) => allStorageDomains.find(sd => sd.id === storageDomainId) && (
    canUserUseStorageDomain || dataCenterStorageDomainsList.find(sd => sd.id === storageDomainId))

  const validateTemplateDiskStorageDomains = (ignoreId) => disks
    .filter(disk => disk.isFromTemplate)
    .filter(disk => disk.id !== ignoreId)
    .map(({ storageDomainId, canUserUseStorageDomain }) => !!isSdOk({ storageDomainId, canUserUseStorageDomain }))
    .filter(valid => !valid)
    .length === 0

  const toGiB = size => size / (1024 ** 3)

  const convertSize = size => {
    const { value: number, unit: storageUnits } = convertValue('B', size)
    return { number, storageUnits }
  }

  const diskList = sortNicsDisks([...disks], locale)

  const translateDiskType = diskType => diskType === 'thin'
    ? msg.diskEditorDiskTypeOptionThin()
    : diskType === 'pre'
      ? msg.diskEditorDiskTypeOptionPre()
      : diskType
  const translateStorageDomain = storageDomainId => allStorageDomains.find(sd => sd.id === storageDomainId)?.value ?? msg.createVmStorageUnknownStorageDomain()

  const onCreateDisk = () => {
    onUpdate({
      valid: false,
      create: {
        id: generateUnique('NEW_'),
        name: '',
        underConstruction: {
          name: suggestDiskName(vmName, disks),

          diskId: '_',
          storageDomainId: dataCenterStorageDomainsList.length === 1 ? dataCenterStorageDomainsList[0].id : '_',

          bootable: disks.length === 0,
          diskType: 'thin',
          size: (minDiskSizeInGiB * 1024 ** 3),
        },
      },
    })
  }

  const onEditDisk = (valid, { id, ...rest }) => {
    onUpdate({
      valid: valid && validateTemplateDiskStorageDomains(id),
      update: {
        id,
        underConstruction: {
          ...rest,
        },
      },
    })
  }

  const onSave = ({ id, underConstruction: { bootable, ...rest } }) => {
    const { id: prevBootableDiskId } = disks.find(disk => disk.bootable) || {}
    // if the edited disk is set bootable, make sure to remove bootable from the other disks
    if (bootable && prevBootableDiskId && prevBootableDiskId !== id) {
      onUpdate({
        update: { id: prevBootableDiskId, bootable: false },
      })
    }
    onUpdate({
      valid: validateTemplateDiskStorageDomains(id),
      update: {
        id,
        bootable,
        ...rest,
        underConstruction: undefined,
      },
    })
  }

  return (
    <div className={style['settings-container']} id={idPrefix}>
      { diskList.length === 0 && (
        <EmptyState variant="xl" isFullHeight>
          <EmptyStateIcon icon={AddCircleOIcon}/>
          <Title headingLevel="h4" size="lg">
            {msg.createVmStorageEmptyTitle()}
          </Title>
          <EmptyStateBody>
            {msg.createVmStorageEmptyInfo()}
          </EmptyStateBody>
          { enableCreate && (
            <EmptyStateSecondaryActions>
              <Button onClick={onCreateDisk}>
                {msg.diskActionCreateNew()}
              </Button>
            </EmptyStateSecondaryActions>
          )}
          { !enableCreate && (
            <EmptyStateBody>
              {msg.diskNoCreate()}
            </EmptyStateBody>
          )}
        </EmptyState>
      ) }

      { diskList.length > 0 && (
        <>
          <div className={style['action-buttons']}>
            <Button isDisabled={!enableCreate} onClick={onCreateDisk}>
              {msg.diskActionCreateNew()}
            </Button>
          </div>
          <div className={style['nic-table']}>
            <TableComposable
              aria-label={msg.disks()}
              variant='compact'
            >
              <Thead>
                <Tr>
                  <Th width={35}>{columnNames.name}</Th>
                  <Th width={15}>{columnNames.size}</Th>
                  <Th width={30}>{columnNames.storageDomain}</Th>
                  <Th width={20}>{columnNames.diskType}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {diskList.map(({ id, underConstruction, ...rest }) => {
                  const { name, storageDomainId, canUserUseStorageDomain, isFromTemplate, bootable, size, diskType } = underConstruction ?? rest
                  const isSdValid = !!isSdOk({ storageDomainId, canUserUseStorageDomain })
                  // for template based disk we need to accept even invalid values
                  // as user is not able to change them (except storage domain)
                  const isNameValid = isDiskNameValid(name) || isFromTemplate
                  const isDiskTypeValid = (diskType && diskType !== '_') || isFromTemplate
                  const isDiskSizeValid = isValidDiskSize(toGiB(size)) || isFromTemplate
                  const isValid = isSdValid && isNameValid && isDiskSizeValid && isDiskTypeValid
                  return (
                    <Tr key={id}>
                      <Td dataLabel={columnNames.name}>
                        {(!underConstruction || isFromTemplate) && <DiskNameWithLabels {...{ id, name, isFromTemplate, bootable }} />}
                        {underConstruction && !isFromTemplate && (
                          <>
                            <TextInput
                              id={`${id}-name-edit`}
                              type='text'
                              validated={isNameValid ? 'default' : 'error'}
                              value={name}
                              onChange={value => onEditDisk(isValid, { id, ...underConstruction, name: value }) }
                            />
                            {!isNameValid && (
                              <HelperText>
                                <HelperTextItem variant="error" hasIcon>
                                  {msg.diskNameValidationRules()}
                                </HelperTextItem>
                              </HelperText>
                            )}
                            <Checkbox
                              isChecked={!!bootable}
                              label={(
                                <>
                                  {msg.diskLabelBootable()}
                                  <InfoTooltip
                                    id={`${idPrefix}-bootable-tooltip`}
                                    tooltip={bootableInfo(bootable)}
                                  />
                                </>
                              )}
                              isDisabled={isBootableDiskTemplate()}
                              id={`${id}-bootable`}
                              onChange={value => onEditDisk(isValid, { id, ...underConstruction, bootable: value }) }
                            />
                          </>
                        )}
                      </Td>
                      <Td dataLabel={columnNames.size}>
                        {(!underConstruction || isFromTemplate) && msg.utilizationCardUnitNumber(convertSize(size))}
                        {underConstruction && !isFromTemplate && (
                          <>
                            <TextInput
                              min={minDiskSizeInGiB}
                              max={maxDiskSizeInGiB}
                              id={`${id}-size-edit`}
                              type='number'
                              validated={isDiskSizeValid ? 'default' : 'error'}
                              value={toGiB(size)} // GiB
                              onChange={value => onEditDisk(
                                isValid,
                                {
                                  id,
                                  ...underConstruction,
                                  size: +value * (1024 ** 3), // GiB to B
                                })}
                            />
                            <HelperText>
                              <HelperTextItem>
                                GiB <InfoTooltip id={`${id}-size-edit-info-tooltip`} tooltip={msg.diskEditorSizeCreateInfoTooltip()} />
                              </HelperTextItem>
                            </HelperText>
                          </>
                        )}
                      </Td>
                      <Td>
                        {!underConstruction && translateStorageDomain(storageDomainId)}
                        {underConstruction && dataCenterStorageDomainsList.length === 0 && (
                          <>
                            {msg.createVmStorageNoStorageDomainAvailable()}
                            { isFromTemplate && (
                              <InfoTooltip
                                id={`${id}-storage-domain-na-tooltip`}
                                tooltip={msg.createVmStorageNoStorageDomainAvailableTooltip()}
                              />
                            )}
                          </>
                        )}
                        {underConstruction && dataCenterStorageDomainsList.length > 0 && (
                          <SelectBox
                            style={{ maxWidth: '15rem' }}
                            id={`${id}-storage-domain-edit`}
                            placeholderText={msg.createVmStorageSelectStorageDomain()}
                            selected={storageDomainId}
                            items={ dataCenterStorageDomainsList.map(({ usage, ...rest }) => ({ description: usage, ...rest }))}
                            validationState={isSdValid ? 'default' : 'error'}
                            onChange={storageDomainId => onEditDisk(isValid, { id, ...underConstruction, storageDomainId }) }
                          />
                        )}
                      </Td>
                      <Td dataLabel={columnNames.diskType}>
                        {(!underConstruction || isFromTemplate) && translateDiskType(diskType)}
                        {underConstruction && !isFromTemplate && (
                          <SelectBox
                            id={`${id}-diskType-edit`}
                            items={createDiskTypeList(msg)}
                            placeholderText={msg.createVmStorageSelectDiskType()}
                            selected={diskType}
                            validationState={isDiskTypeValid ? 'default' : 'error'}
                            onChange={diskType => onEditDisk(isValid, { id, ...underConstruction, diskType }) }
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
                                  ...rest,
                                },
                              },
                            }),
                          },
                          underConstruction && {
                            ariaLabel: msg.save(),
                            id: `${id}-save`,
                            icon: (<CheckIcon/>),
                            isDisabled: !isValid,
                            onClick: () => onSave({ id, underConstruction }),
                          },
                          underConstruction && {
                            ariaLabel: msg.cancel(),
                            id: `${id}-cancel`,
                            icon: (<TimesIcon/>),
                            // template cannot be edited again
                            isDisabled: isFromTemplate && !isValid,
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
                          .map(({ ariaLabel, ...rest }, index) => (
                            <Tooltip key={ariaLabel} content={ariaLabel}>
                              <Button
                                style={{ paddingLeft: '0px', paddingRight: index % 2 ? '0px' : undefined }}
                                variant={ButtonVariant.link}
                                aria-label={ariaLabel}
                                { ...rest}
                              />
                            </Tooltip>
                          ))}
                        { !underConstruction && isFromTemplate && <Tooltip id={`${id}-info-tooltip`} content={msg.createVmStorageNoEditHelpMessage()}><InfoCircleIcon/></Tooltip>}
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

Storage.propTypes = {
  id: PropTypes.string,
  vmName: BASIC_DATA_SHAPE.name.isRequired,
  optimizedFor: BASIC_DATA_SHAPE.optimizedFor,
  disks: PropTypes.arrayOf(PropTypes.shape(STORAGE_SHAPE)).isRequired,

  clusterId: PropTypes.string.isRequired, // eslint-disable-line react/no-unused-prop-types
  dataCenterId: PropTypes.string.isRequired,

  cluster: PropTypes.object.isRequired,
  storageDomains: PropTypes.object.isRequired,
  maxDiskSizeInGiB: PropTypes.number.isRequired,
  minDiskSizeInGiB: PropTypes.number.isRequired,
  onUpdate: PropTypes.func.isRequired,
  msg: PropTypes.object.isRequired,
  locale: PropTypes.string.isRequired,
}

export default connect(
  (state, { clusterId }) => ({
    cluster: state.clusters.get(clusterId),
    storageDomains: state.storageDomains,
    maxDiskSizeInGiB: 4096, // TODO: 4TiB, no config option pulled as of 2019-Mar-22
    minDiskSizeInGiB: 1,
  })
)(withMsg(Storage))
