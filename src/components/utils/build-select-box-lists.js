import {
  filterOsByArchitecture,
  getClusterArchitecture,
  localeCompare,
  templateNameRenderer,
} from '_/helpers'
import { enumMsg } from '_/intl'
import { convertValue } from '_/utils'
import { EMPTY_VNIC_PROFILE_ID } from '_/constants'

/**
 * Return a normalized and sorted list of clusters ready for use in a __SelectBox__ from
 * the Map of provided clusters, optionally limiting to clusters in a given data center.
 */
function createClusterList ({ clusters, dataCenterId = null, architecture = null, locale }) {
  const clusterList =
    clusters
      .toList()
      .filter(cluster =>
        cluster.get('canUserUseCluster') &&
        !!cluster.get('architecture') &&
        cluster.get('architecture') !== 'undefined' &&
        !!cluster.get('cpuType') &&
        (architecture === null || cluster.get('architecture') === architecture) &&
        (dataCenterId === null || cluster.get('dataCenterId') === dataCenterId)
      )
      .map(cluster => ({
        id: cluster.get('id'),
        value: cluster.get('name'),
        datacenter: cluster.get('dataCenterId'),
      }))
      .sort((a, b) => localeCompare(a.value, b.value, locale))
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
function createOsList ({ clusterId, clusters, operatingSystems, locale }) {
  if (!clusterId && !clusters && !clusters.has(clusterId)) {
    return []
  }

  const osList =
    filterOsByArchitecture(operatingSystems, getClusterArchitecture(clusterId, clusters))
      .toList()
      .map(os => ({
        id: os.get('id'),
        value: os.get('description'),
      }))
      .sort((a, b) => localeCompare(a.value, b.value, locale))
      .toJS()

  return osList
}

/**
 * Return a normalized and sorted list of storage domains for use in a __SelectBox__
 * from the List of provided storage domains, optionally filtered to be active in the
 * provided data center.
 */
function createStorageDomainList ({ storageDomains, dataCenterId = null, includeUsage = false, locale, msg }) {
  const storageDomainList =
    storageDomains
      .toList()
      .filter(sd =>
        sd.get('canUserUseDomain') &&
        sd.get('type') === 'data' &&
        (dataCenterId === null
          ? true
          : sd.getIn(['statusPerDataCenter', dataCenterId]) === 'active')
      )
      .map(sd => {
        const avail = convertValue('B', sd.get('availableSpace', 0))
        return {
          id: sd.get('id'),
          value:
            sd.get('name') +
            (includeUsage ? ' ' + msg.storageDomainFreeSpace({ size: avail.value, unit: avail.unit }) : ''),
        }
      })
      .sort((a, b) => localeCompare(a.value, b.value, locale))
      .toJS()

  return storageDomainList
}

/**
 * Return a normalized and sorted list of Templates ready for use in a __SelectBox__ from
 * the Map of provided templates cross referenced to the given cluster.
 */
function createTemplateList ({ templates, clusterId = null, locale }) {
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
      .sort((a, b) => localeCompare(a.value, b.value, locale))
      .toJS()

  return templateList
}

/**
 * Filter the set of vNIC profiles to display to the user such that:
 *   - each vNIC is in the same data center as the VM
 *   - each vNIC's network is available on the same cluster as the VM
 */
function createVNicProfileList (vnicProfiles, { locale, msg }, { dataCenterId = null, cluster = null } = {}) {
  const clusterNetworks = cluster === null ? [] : cluster.get('networks')

  const vnicList =
    vnicProfiles
      .toList()
      .filter(vnic =>
        vnic.get('canUserUseProfile') &&
        (dataCenterId === null ? true : vnic.get('dataCenterId') === dataCenterId) &&
        (cluster === null ? true : clusterNetworks.contains(vnic.getIn(['network', 'id'])))
      )
      .map(vnic => ({
        id: vnic.get('id'),
        value: `${vnic.getIn(['network', 'name'])}/${vnic.get('name')}`,
      }))
      .sort((a, b) => localeCompare(a.value, b.value, locale))
      .toJS()
  vnicList.unshift({ id: EMPTY_VNIC_PROFILE_ID, value: msg.vnicProfileEmpty() }) // always add an empty/unassigned option to the list, unassigned is always a valid value for a Nic's vnicProfile

  return vnicList
}

/**
 * Return a list of the disk types, a combine value for __disk format__ and __sparse__
 * Disk attributes, ready for use in a __SelectBox__.  This list is static and corresponds
 * to the relevant entries on the Disk type in the REST API:
 *
 *   - http://ovirt.github.io/ovirt-engine-api-model/master/#types/disk attributes:
 *     - sparse (boolean)
 *     - format (http://ovirt.github.io/ovirt-engine-api-model/master/#types/disk_format)
 */
function createDiskTypeList (msg) {
  return [
    {
      id: 'pre',
      value: msg.diskEditorDiskTypeOptionPre(),
    },
    {
      id: 'thin',
      value: msg.diskEditorDiskTypeOptionThin(),
    },
  ]
}

/**
 * Return a list of the interface types available to DiskAttachments ready for use in a
 * __SelectBox__.  This list is static and corresponds to the relevant entries in:
 *
 *    http://ovirt.github.io/ovirt-engine-api-model/master/#types/disk_interface
 */
function createDiskInterfacesList (msg) {
  return [
    {
      id: 'ide',
      value: enumMsg('DiskInterface', 'ide', msg),
    },
    {
      id: 'virtio_scsi',
      value: enumMsg('DiskInterface', 'virtio_scsi', msg),
    },
    {
      id: 'virtio',
      value: enumMsg('DiskInterface', 'virtio', msg),
    },
  ]
}

/**
 * Return a list of the interface types available to Nics ready for use in a
 * __SelectBox__.  This list is static and corresponds to the relevant entries in:
 *
 *    http://ovirt.github.io/ovirt-engine-api-model/master/#types/nic_interface
 */
function createNicInterfacesList (msg) {
  return [
    {
      id: 'virtio',
      value: enumMsg('NicInterface', 'virtio', msg),
    },
    {
      id: 'rtl8139',
      value: enumMsg('NicInterface', 'rtl8139', msg),
    },
    {
      id: 'e1000',
      value: enumMsg('NicInterface', 'e1000', msg),
    },
  ]
}

export {
  createClusterList,
  createIsoList,
  createOsList,
  createStorageDomainList,
  createTemplateList,
  createVNicProfileList,

  createDiskTypeList,
  createDiskInterfacesList,
  createNicInterfacesList,
}
