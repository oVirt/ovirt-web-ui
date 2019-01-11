import Api from '_/ovirtapi'
import { all, put, select, takeLatest, throttle } from 'redux-saga/effects'
import { callExternalAction, fetchPermits, PermissionsType } from './utils'

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
  Object.assign(action, { payload: { additional: [ 'storage_domains' ] } })
  const dataCentersApi = yield callExternalAction('getAllDataCenters', Api.getAllDataCenters, action)
  if (!dataCentersApi || !dataCentersApi.data_center) {
    return
  }

  // getting data centers is necessary to get storage domains with statuses
  // so why not to store them when we have them fresh
  const dataCentersInternal = dataCentersApi.data_center.map(dataCenter => Api.dataCenterToInternal({ dataCenter }))
  yield put(setDataCenters(dataCentersInternal))

  // transform all storage domains from dataCentersApi.data_center[*].storage_domains.storage_domain[*]
  const storageDomainsInternal = []
  for (const dataCenter of dataCentersApi.data_center) {
    const storageDomains = dataCenter.storage_domains && dataCenter.storage_domains.storage_domain
    if (storageDomains) {
      storageDomainsInternal.push(
        ...(
          yield all(
            storageDomains.map(
              function* (storageDomain) {
                let storageDomainInternal = Api.storageDomainToInternal({ storageDomain })
                storageDomainInternal.permits = yield fetchPermits({ entityType: PermissionsType.STORAGE_DOMAIN_TYPE, id: storageDomain.id })
                storageDomainInternal.canUserUseDomain = canUserUseStorageDomain(storageDomainInternal.permits)
                return storageDomainInternal
              }
            )
          )
        )
      )
    }
  }

  // since storage domains can be attached to >1 data center, collate the copies
  // and track the domain's status per data center
  const storageDomainsMerged = mergeStorageDomains(storageDomainsInternal)
  yield put(setStorageDomains(storageDomainsMerged))
}

/**
 * From a list of storage domains, where a storage domain may occur multiple times
 * with a different data center, build a unique list of storage domains.  Each storage
 * domain returned will contain a data center to SD status map.
 */
function mergeStorageDomains (storageDomainsInternal) {
  const idToStorageDomain = storageDomainsInternal.reduce(
    (accum, storageDomain) => {
      const merged = accum[storageDomain.id]
      if (merged) {
        Object.assign(merged.statusPerDataCenter, storageDomain.statusPerDataCenter)
      } else {
        accum[storageDomain.id] = storageDomain
      }
      return accum
    },
    {}
  )

  const mergedStorageDomains = Object.values(idToStorageDomain)
  return mergedStorageDomains
}

/**
 * Fetch all of the ISO images from both 'iso' type storage domains and 'iso' types
 * images from other types of storage domains.
 */
export function* fetchIsoFiles (action) {
  // fetch ISO disk images and distribute them to their storage domains as files
  const images = yield callExternalAction('getIsoImages', Api.getIsoImages, { payload: {} })
  if (images && images.disk) {
    const storageDomainToDisks = images.disk.reduce(
      (acc, disk) => {
        disk.storage_domains.storage_domain.forEach(({ id }) => {
          const files = acc[id] = acc[id] || []
          files.push(Api.fileToInternal({ file: disk }))
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

  // fetch 'files' from ISO storage domains
  const storageDomains = yield select((state) => state.storageDomains)

  const isoStorageDomains = storageDomains
    .filter(storageDomain => storageDomain.get('type') === 'iso')
    .keySeq()
    .toArray()

  const isoFilesFetches = isoStorageDomains.map(isoStorageDomain => fetchAllFilesForISO(isoStorageDomain))
  yield all(isoFilesFetches)
}

function* fetchAllFilesForISO (storageDomainId) {
  const files = yield callExternalAction('getStorageFiles', Api.getStorageFiles, { payload: { storageId: storageDomainId } })
  if (files && files.file) {
    const filesInternal = files.file.map(file => Api.fileToInternal({ file }))
    yield put(setStorageDomainsFiles(storageDomainId, filesInternal))
  }
}

export default [
  takeLatest(GET_ALL_STORAGE_DOMAINS, fetchDataCentersAndStorageDomains),
  throttle(100, GET_ISO_FILES, fetchIsoFiles),
]
