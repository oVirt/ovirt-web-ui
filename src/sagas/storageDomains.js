import Api, { Transforms } from '_/ovirtapi'
import { all, call, put, select } from 'redux-saga/effects'

import { callExternalAction, entityPermissionsToUserPermits } from './utils'
import { canUserUseStorageDomain } from '_/utils'

import {
  setDataCenters,
  setStorageDomains,
  setStorageDomainsFiles,
} from '_/actions'

/**
 * Fetch all data centers and attached storage domains.  By fetching the storage domains
 * along with the data centers, we can keep track of the storage domain status per data
 * center.
 */
export function* fetchDataCentersAndStorageDomains () {
  const [dataCenters, storageDomains] =
    yield all([
      call(fetchDataCenters),
      call(fetchDataAndIsoStorageDomains),
    ])

  // figure out the domain's status per data center
  const sdById = storageDomains.reduce((acc, sd) => ({ ...acc, [sd.id]: sd }), {})
  for (const dataCenter of dataCenters) {
    for (const [storageDomainId, { type }] of Object.entries(dataCenter.storageDomains)) {
      if (type === 'data' || type === 'iso') {
        const sd = sdById[storageDomainId]
        sd.statusPerDataCenter = {
          ...sd.statusPerDataCenter,
          [dataCenter.id]: dataCenter.storageDomains[storageDomainId].status,
        }
      }
    }
  }

  yield put(setDataCenters(dataCenters))
  yield put(setStorageDomains(storageDomains))
}

function* fetchDataCenters () {
  const payload = { additional: ['permissions', 'storage_domains'] }
  const dataCentersApi = yield callExternalAction(Api.getAllDataCenters, { payload })

  if (dataCentersApi && dataCentersApi.data_center) {
    const dataCentersInternal = dataCentersApi.data_center.map(
      dataCenter => Transforms.DataCenter.toInternal({ dataCenter })
    )

    // Calculate permits and 'canUser*'
    for (const dataCenter of dataCentersInternal) {
      dataCenter.userPermits = yield entityPermissionsToUserPermits(dataCenter)
    }

    return dataCentersInternal
  }

  return []
}

function* fetchDataAndIsoStorageDomains () {
  const storageDomainsApi = yield callExternalAction(Api.getStorages, { payload: {} })

  if (storageDomainsApi && storageDomainsApi.storage_domain) {
    const storageDomainsInternal = storageDomainsApi.storage_domain
      .map(storageDomain => Transforms.StorageDomain.toInternal({ storageDomain }))
      .filter(storageDomain => storageDomain.type === 'data' || storageDomain.type === 'iso')

    // Calculate permits and 'canUser*'
    for (const storageDomain of storageDomainsInternal) {
      storageDomain.userPermits = yield entityPermissionsToUserPermits(storageDomain)
      storageDomain.canUserUseDomain = canUserUseStorageDomain(storageDomain.userPermits)
    }

    // Calculate values that require system configuration knowledge
    for (const storageDomain of storageDomainsInternal) {
      const diskTypeToDiskAttributes = storageDomain.diskTypeToDiskAttributes
      const defaultDiskFormatToSparse = storageDomain.defaultDiskFormatToSparse

      //
      // These values are calculated as needed in webadmin.  We pre-calculate the values
      // here for ease of use via simple lookup.
      //
      // storageSubType from: backend/manager/modules/common/src/main/java/org/ovirt/engine/core/common/businessentities/storage/StorageType.java
      // diskTypeToDiskAttributes from: frontend/webadmin/modules/uicommonweb/src/main/java/org/ovirt/engine/ui/uicommonweb/dataprovider/AsyncDataProvider.java#getDiskVolumeFormat
      // defaultDiskFormatToSparse from: frontend/webadmin/modules/uicommonweb/src/main/java/org/ovirt/engine/ui/uicommonweb/dataprovider/AsyncDataProvider.java#getVolumeType
      //
      switch (storageDomain.storageType) {
        case 'nfs':
        case 'localfs':
        case 'posixfs':
        case 'glusterfs':
        case 'glance':
          storageDomain.storageSubType = 'file'
          diskTypeToDiskAttributes.thin.format = 'raw'
          diskTypeToDiskAttributes.pre.format = 'raw'
          defaultDiskFormatToSparse.cow = true
          defaultDiskFormatToSparse.raw = (isCopyPreallocatedFileBasedDiskSupported, disk) =>
            disk && isCopyPreallocatedFileBasedDiskSupported
              ? disk.sparse
              : true
          break

        case 'fcp':
        case 'iscsi':
          storageDomain.storageSubType = 'block'
          diskTypeToDiskAttributes.thin.format = 'cow'
          diskTypeToDiskAttributes.pre.format = 'raw'
          defaultDiskFormatToSparse.cow = true
          defaultDiskFormatToSparse.raw = false
          break

        case 'cinder':
        case 'managed_block_storage':
          storageDomain.storageSubType = 'openstack'
          diskTypeToDiskAttributes.thin.format = undefined
          diskTypeToDiskAttributes.pre.format = 'raw'
          defaultDiskFormatToSparse.cow = true
          defaultDiskFormatToSparse.raw = false
          break

        case 'unmanaged':
          storageDomain.storageSubType = 'kubernetes'
          diskTypeToDiskAttributes.thin.format = undefined
          diskTypeToDiskAttributes.pre.format = undefined
          defaultDiskFormatToSparse.cow = true
          defaultDiskFormatToSparse.raw = false
          break

        default:
          storageDomain.storageSubType = 'none'
          diskTypeToDiskAttributes.thin.format = undefined
          diskTypeToDiskAttributes.pre.format = undefined
          defaultDiskFormatToSparse.cow = true
          defaultDiskFormatToSparse.raw = false
      }
    }

    return storageDomainsInternal
  }

  return []
}

/**
 * Fetch all of the ISO images from both 'iso' type storage domains and 'iso' types
 * images from other types of storage domains.
 */
export function* fetchIsoFiles () {
  yield all([
    call(fetchIsoDiskImages),
    call(fetchIsoFilesFromIsoStorageDomains),
  ])
}

/**
 * Fetch ISO disk images and distribute them to their storage domains as files
 */
function* fetchIsoDiskImages () {
  const images = yield callExternalAction(Api.getIsoImages, { payload: {} })
  if (images && images.disk) {
    const storageDomainToDisks = images.disk.reduce(
      (acc, disk) => {
        disk.storage_domains.storage_domain.forEach(({ id }) => {
          const files = acc[id] = acc[id] || []
          files.push(Transforms.StorageDomainFile.toInternal({ file: disk }))
        })
        return acc
      },
      {}
    )

    const updates = Object.entries(storageDomainToDisks).map(
      function* ([sd, files]) {
        yield put(setStorageDomainsFiles(sd, files))
      }
    )
    yield all(updates)
  }
}

/**
 * Fetch 'files' from all ISO storage domains
 */
function* fetchIsoFilesFromIsoStorageDomains () {
  const storageDomains = yield select((state) => state.storageDomains)

  const isoStorageDomains = storageDomains
    .filter(storageDomain => storageDomain.get('type') === 'iso')
    .keySeq()
    .toArray()

  const isoFilesFetches = isoStorageDomains.map(fetchIsoFilesFromIsoStorageDomain)
  yield all(isoFilesFetches)
}

/**
 * Fetch 'files' from the single given ISO storage domain
 */
function* fetchIsoFilesFromIsoStorageDomain (storageDomainId) {
  const files = yield callExternalAction(Api.getStorageFiles, { payload: { storageId: storageDomainId } })
  if (files && files.file) {
    const filesInternal = files.file.map(
      file => Transforms.StorageDomainFile.toInternal({ file })
    )
    yield put(setStorageDomainsFiles(storageDomainId, filesInternal))
  }
}
