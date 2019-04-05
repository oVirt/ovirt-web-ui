import {
  filterOsByArchitecture,
  localeCompare,
  templateNameRenderer,
} from '_/helpers'
import { enumMsg } from '_/intl'

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
 * the Map of provided clusters, optionally limiting to clusters in a given data center.
 */
function createClusterList (clusters, dataCenterId = null) {
  const clusterList =
    clusters
      .toList()
      .filter(cluster =>
        cluster.get('canUserUseCluster') &&
        (dataCenterId === null
          ? true
          : cluster.get('dataCenterId') === dataCenterId)
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
 * optionally limiting to ISOs available in a given data center.
 */
function createIsoList (storageDomains, dataCenterId = null) {
  const list = []

  storageDomains
    .toList()
    .filter(storageDomain =>
      storageDomain.has('files') &&
      storageDomain.get('canUserUseDomain') &&
      (dataCenterId === null
        ? true
        : storageDomain.getIn([ 'statusPerDataCenter', dataCenterId ]) === 'active')
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

/**
 * Return a normalized and sorted list of Templates ready for use in a __SelectBox__ from
 * the Map of provided templates cross referenced to the given cluster.
 */
function createTemplateList (templates, clusterId = false) {
  function testCluster (template) {
    const templateCluster = template.get('clusterId')
    return templateCluster === null || (clusterId && templateCluster === clusterId)
  }

  const templateList =
    templates
      .toList()
      .filter(template =>
        // TODO: template.get('canUserUseTemplate') &&
        testCluster(template)
      )
      .map(template => ({
        id: template.get('id'),
        value: templateNameRenderer(template),
      }))
      .sort((a, b) => localeCompare(a.value, b.value))
      .toJS()

  return templateList
}

/**
 * Return a list of the interface types available to Nics ready for use in a
 * __SelectBox__.  This list is static and corresponds to the relevant entries in:
 *
 *    http://ovirt.github.io/ovirt-engine-api-model/master/#types/nic_interface
 */
function createNicInterfacesList () {
  return [
    {
      id: 'virtio',
      value: enumMsg('NicInterface', 'virtio'),
    },
    {
      id: 'rtl8139',
      value: enumMsg('NicInterface', 'rtl8139'),
    },
    {
      id: 'e1000',
      value: enumMsg('NicInterface', 'e1000'),
    },
  ]
}

/**
 * Filter the set of vNIC profiles to display to the user such that:
 *   - each vNIC is in the same data center as the VM
 *   - each vNIC's network is available on the same cluster as the VM
 */
function createVNicProfileList (vnicProfiles, { dataCenterId = false, cluster = false } = {}) {
  const clusterNetworks = cluster ? cluster.get('networks') : []

  const vnicList =
    vnicProfiles
      .toList()
      .filter(vnic =>
        (dataCenterId ? vnic.get('dataCenterId') === dataCenterId : true) &&
        (cluster ? clusterNetworks.contains(vnic.getIn(['network', 'id'])) : true) &&
        vnic.get('canUserUseProfile')
      )
      .map(
        vnic => ({
          id: vnic.get('id'),
          value: `${vnic.getIn(['network', 'name'])}/${vnic.get('name')}`,
        })
      )
      .sort((a, b) => localeCompare(a.value, b.value))
      .toJS()

  return vnicList
}

export {
  createClusterList,
  createDataCenterList,
  createIsoList,
  createNicInterfacesList,
  createOsList,
  createTemplateList,
  createVNicProfileList,
}
