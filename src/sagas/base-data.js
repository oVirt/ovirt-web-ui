import Api, { Transforms } from '_/ovirtapi'
import { put, select, takeLatest, all, call } from 'redux-saga/effects'
import {
  canUserUseTemplate,
  canUserUseCluster,
  canUserUseVnicProfile,
} from '_/utils'

import {
  callExternalAction,
  entityPermissionsToUserPermits,
  mapCpuOptions,
} from './utils'

import {
  setClusters,
  setHosts,
  setOperatingSystems,
  setTemplates,
  setUserGroups,
  setVnicProfiles,
} from '_/actions'

import {
  GET_ALL_CLUSTERS,
  GET_ALL_HOSTS,
  GET_ALL_OS,
  GET_ALL_TEMPLATES,
  GET_ALL_VNIC_PROFILES,
  GET_USER_GROUPS,
} from '_/constants'

import { EVERYONE_GROUP_ID } from './index'
import { fetchUnknownIcons } from './osIcons'

export function* fetchAllClusters (action) {
  const clusters = yield callExternalAction('getAllClusters', Api.getAllClusters, action)

  if (clusters && clusters['cluster']) {
    const clustersInternal = clusters.cluster.map(
      cluster => Transforms.Cluster.toInternal({ cluster })
    )

    // Calculate permits and 'canUser*'
    for (const cluster of clustersInternal) {
      cluster.userPermits = yield entityPermissionsToUserPermits(cluster)
      cluster.canUserUseCluster = canUserUseCluster(cluster.userPermits)
    }

    // Map cluster attribute derived config values to the clusters
    for (const cluster of clustersInternal) {
      cluster.cpuOptions = yield mapCpuOptions(cluster.version, cluster.architecture)
    }

    yield put(setClusters(clustersInternal))
  }
}

export function* fetchAllHosts (action) {
  const hosts = yield callExternalAction('getAllHosts', Api.getAllHosts, action)

  if (hosts && hosts['host']) {
    const hostsInternal = hosts.host.map(
      host => Transforms.Host.toInternal({ host })
    )

    yield put(setHosts(hostsInternal))
  }
}

export function* fetchAllOS (action) {
  const operatingSystems = yield callExternalAction('getAllOperatingSystems', Api.getAllOperatingSystems, action)

  if (operatingSystems && operatingSystems['operating_system']) {
    const operatingSystemsInternal = operatingSystems.operating_system.map(
      os => Transforms.OS.toInternal({ os })
    )

    yield put(setOperatingSystems(operatingSystemsInternal))
    yield fetchUnknownIcons({ os: operatingSystemsInternal }) // load icons for OS
  }
}

export function* fetchAllTemplates (action) {
  const templates = yield callExternalAction('getAllTemplates', Api.getAllTemplates, action)

  if (templates && templates['template']) {
    const templatesInternal = templates.template.map(
      template => Transforms.Template.toInternal({ template })
    )

    // Calculate permits and 'canUser*'
    for (const template of templatesInternal) {
      template.userPermits = yield entityPermissionsToUserPermits(template)
      template.canUserUseTemplate = canUserUseTemplate(template.userPermits)
    }

    // Map template attribute derived config values to the templates
    for (const template of templatesInternal) {
      const customCompatVer = template.customCompatibilityVersion

      template.cpuOptions = customCompatVer
        ? yield mapCpuOptions(customCompatVer, template.cpu.arch)
        : null
    }

    yield put(setTemplates(templatesInternal))
  }
}

export function* fetchAllVnicProfiles (action) {
  const vnicProfiles = yield callExternalAction('getAllVnicProfiles', Api.getAllVnicProfiles, action)

  if (vnicProfiles && vnicProfiles['vnic_profile']) {
    const vnicProfilesInternal = vnicProfiles.vnic_profile.map(
      vnicProfile => Transforms.VNicProfile.toInternal({ vnicProfile })
    )

    // Calculate permits and 'canUser*'
    for (const vnicProfile of vnicProfilesInternal) {
      vnicProfile.userPermits = yield entityPermissionsToUserPermits(vnicProfile)
      vnicProfile.canUserUseProfile = canUserUseVnicProfile(vnicProfile.userPermits)
    }

    yield put(setVnicProfiles({ vnicProfiles: vnicProfilesInternal }))
  }
}

/**
 * Fetch the user's ovirt known groups by fetching and cross referencing the users's
 * domain groups with the ovirt known groups.  Permission checks require ovirt group
 * uuids, not the domain entity ids.
 *
 * Users can belong to more domain groups than ovirt groups.  The ovirt group fetch will
 * return all groups the user can SEE but does not contain any membership information.
 * The cross reference will turn domain groups membership into ovirt group membership.
 * ovirt group uuids are stored in state.
 */
export function* fetchUserGroups () {
  const userId = yield select(state => state.config.getIn(['user', 'id']))

  const {
    domainGroups,
    ovirtGroups,
  } = yield all({
    domainGroups: call(function* (userId) {
      const { group: groups = [] } = yield callExternalAction('userDomainGroups', Api.userDomainGroups, { payload: { userId } })
      return groups.map(group => group.id)
    }, userId),

    ovirtGroups: call(function* () {
      const { group: groups = [] } = yield callExternalAction('groups', Api.groups)
      return groups.map(group => ({
        domainEntryId: group.domain_entry_id,
        ovirtId: group.id,
      }))
    }),
  })

  // Cross reference domainGroups with ovirtGroups to hold on to ovirt group
  // ids that the user is a member of
  const groupIds = []
  groupIds.push(EVERYONE_GROUP_ID)

  ovirtGroups.forEach(ovirtGroup => {
    if (domainGroups.includes(ovirtGroup.domainEntryId)) {
      groupIds.push(ovirtGroup.ovirtId)
    }
  })

  yield put(setUserGroups({ groups: groupIds }))
}

export default [
  takeLatest(GET_ALL_CLUSTERS, fetchAllClusters),
  takeLatest(GET_ALL_HOSTS, fetchAllHosts),
  takeLatest(GET_ALL_OS, fetchAllOS),
  takeLatest(GET_ALL_TEMPLATES, fetchAllTemplates),
  takeLatest(GET_ALL_VNIC_PROFILES, fetchAllVnicProfiles),
  takeLatest(GET_USER_GROUPS, fetchUserGroups),
]
