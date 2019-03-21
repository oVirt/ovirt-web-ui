import { localeCompare, filterOsByArchitecture } from '_/helpers'

/**
 * Return a normalized and sorted list of data centers for use in a __SelectBox__ from
 * the list of provided data centers.
 */
function createDataCenterList (dataCenters) {
  const dataCenterList =
    dataCenters
      .toList()
      .filter(datacenter => true) // TODO: canUserUseDataCenter permission check?
      .map(dataCenter => ({
        id: dataCenter.id,
        value: dataCenter.name,
      }))
      .sort((a, b) => localeCompare(a.value, b.value))
      .toJS()

  return dataCenterList
}

/**
 * Return a normalized and sorted list of clusters ready for use in a __SelectBox__ from
 * the Map of provided clusters.
 */
function createClusterList (clusters, dataCenterId = null) {
  const clusterList =
    clusters
      .toList()
      .filter(cluster =>
        cluster.get('canUserUseCluster') &&
        (dataCenterId ? cluster.get('dataCenterId') === dataCenterId : true)
      )
      .map(cluster => ({
        id: cluster.get('id'),
        value: cluster.get('name'),
        datacenter: cluster.get('dataCenterId'),
      }))
      .sort((a, b) => localeCompare(a.value, b.value))
      .toJS()

  return clusterList
}

/**
 * Return a normalized list of iso files from the set of provided storage domains,
 * optionally filtering based on the provided data center.
 */
function createIsoList (storageDomains, dataCenterId = null) {
  const list = []

  storageDomains
    .toList()
    .filter(storageDomain =>
      storageDomain.has('files') &&
      storageDomain.get('canUserUseDomain') &&
      (dataCenterId ? storageDomain.getIn([ 'statusPerDataCenter', dataCenterId ]) === 'active' : true)
    )
    .forEach(storageDomain => {
      storageDomain.get('files').forEach(file => {
        list.push({
          sd: {
            id: storageDomain.get('id'),
            name: storageDomain.get('name'),
          },
          file: {
            id: file.id,
            name: file.name,
          },
        })
      })
    })

  return list
}

/**
 * Return a normalized and sorted list of OS ready for use in a __SelectBox__ from
 * the Map of provided operating systems cross referenced to the given Cluster's
 * architecture.
 */
function createOsList (clusterId, clusters, operatingSystems) {
  if (!clusterId && !clusters && !clusters.has(clusterId)) {
    return []
  }

  const cluster = clusters && clusters.get(clusterId)
  const architecture = cluster && cluster.get('architecture')
  const osList =
    filterOsByArchitecture(operatingSystems, architecture)
      .toList()
      .map(os => (
        {
          id: os.get('id'),
          value: os.get('description'),
        }
      ))
      .sort((a, b) => localeCompare(a.value, b.value))
      .toJS()

  return osList
}

export {
  createClusterList,
  createDataCenterList,
  createIsoList,
  createOsList,
}
