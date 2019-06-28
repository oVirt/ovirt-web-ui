import Api, { Transforms } from '_/ovirtapi'
import { all, call, put, select, takeLatest, throttle } from 'redux-saga/effects'
import { callExternalAction, permissionsToUserPermits } from './utils'

import { canUserUseStorageDomain } from '_/utils'

import {
  setDataCenters,
  setStorageDomains,
  setStorageDomainsFiles,
} from '_/actions'
import {
  GET_ALL_STORAGE_DOMAINS,
  GET_ISO_FILES,
} from '_/constants'

/**
 * Fetch all data centers and attached storage domains.  By fetching the storage domains
 * along with the data centers, we can keep track of the storage domain status per data
 * center.
 */
export function* fetchDataCentersAndStorageDomains (action) {
  const [ dataCenters, storageDomains ] =
    yield all([
      call(fetchDataCenters),
      call(fetchDataAndIsoStorageDomains),
    ])

  // figure out the domain's status per data center
  const sdById = storageDomains.reduce((acc, sd) => ({ ...acc, [sd.id]: sd }), {})
  for (const dataCenter of dataCenters) {
    for (const storageDomainId of Object.keys(dataCenter.storageDomains)) {
      const sd = sdById[ storageDomainId ]
      sd.statusPerDataCenter = {
        ...sd.statusPerDataCenter,
        [dataCenter.id]: dataCenter.storageDomains[storageDomainId].status,
      }
    }
  }

  yield put(setDataCenters(dataCenters))
  yield put(setStorageDomains(storageDomains))
}

function* fetchDataCenters () {
  const payload = { additional: [ 'permissions', 'storage_domains' ] }
  const dataCentersApi = yield callExternalAction('getAllDataCenters', Api.getAllDataCenters, { payload })

  if (dataCentersApi && dataCentersApi.data_center) {
    const dataCentersInternal = dataCentersApi.data_center.map(
      dataCenter => Transforms.DataCenter.toInternal({ dataCenter })
    )

    // Calculate permits and 'canUser*'
    for (const dataCenter of dataCentersInternal) {
      dataCenter.userPermits = yield permissionsToUserPermits(dataCenter.permissions)
    }

    return dataCentersInternal
  }

  return []
}

function* fetchDataAndIsoStorageDomains () {
  const storageDomainsApi = yield callExternalAction('getStorages', Api.getStorages, { payload: {} })

  if (storageDomainsApi && storageDomainsApi.storage_domain) {
    const storageDomainsInternal = storageDomainsApi.storage_domain
      .map(storageDomain => Transforms.StorageDomain.toInternal({ storageDomain }))
      .filter(storageDomain => storageDomain.type === 'data' || storageDomain.type === 'iso')

    // Calculate permits and 'canUser*'
    for (const storageDomain of storageDomainsInternal) {
      storageDomain.userPermits = yield permissionsToUserPermits(storageDomain.permissions)
      storageDomain.canUserUseDomain = canUserUseStorageDomain(storageDomain.userPermits)
    }

    return storageDomainsInternal
  }

  return []
}

/**
 * Fetch all of the ISO images from both 'iso' type storage domains and 'iso' types
 * images from other types of storage domains.
 */
export function* fetchIsoFiles (action) {
  yield all([
    call(function* () {
      // fetch ISO disk images and distribute them to their storage domains as files
      const images = yield callExternalAction('getIsoImages', Api.getIsoImages, { payload: {} })
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
    }),

    call(function* () {
      // fetch 'files' from ISO storage domains
      const storageDomains = yield select((state) => state.storageDomains)

      const isoStorageDomains = storageDomains
        .filter(storageDomain => storageDomain.get('type') === 'iso')
        .keySeq()
        .toArray()

      const isoFilesFetches = isoStorageDomains.map(fetchAllFilesForISO)
      yield all(isoFilesFetches)
    }),
  ])
}

function* fetchAllFilesForISO (storageDomainId) {
  const files = yield callExternalAction('getStorageFiles', Api.getStorageFiles, { payload: { storageId: storageDomainId } })
  if (files && files.file) {
    const filesInternal = files.file.map(
      file => Transforms.StorageDomainFile.toInternal({ file })
    )
    yield put(setStorageDomainsFiles(storageDomainId, filesInternal))
  }
}

export default [
  takeLatest(GET_ALL_STORAGE_DOMAINS, fetchDataCentersAndStorageDomains),
  throttle(100, GET_ISO_FILES, fetchIsoFiles),
]
