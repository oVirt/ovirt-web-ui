/* eslint-env jest */
import { fromJS } from 'immutable'
import { Transforms } from '_/ovirtapi'
import { determineTemplateDiskFormatAndSparse } from './vmChanges'

describe('direct determineTemplateDiskFormatAndSparse()', () => {
  const cluster = fromJS({
    ...Transforms.Cluster.toInternal({
      cluster: {
        id: '#cluster',
        version: '4.6',
      },
    }),
    // saga generated values done before putting to reducers and needed for unit tests
    isCopyPreallocatedFileBasedDiskSupported: true,
  })

  const storageDomainNfs = fromJS(Transforms.StorageDomain.toInternal({
    storageDomain: {
      id: '#storageDomain_NFS',
      type: 'data',
      storage: {
        type: 'nfs',
      },
    },
  }))

  const storageDomainIscsi = fromJS(Transforms.StorageDomain.toInternal({
    storageDomain: {
      id: '#storageDomain_ISCSI',
      type: 'data',
      storage: {
        type: 'iscsi',
      },
    },
  }))

  const templateDesktop = fromJS(Transforms.Template.toInternal({
    template: {
      id: '#template_desktop',
      cpu: { architecture: 'x86_64', topology: { cores: '1', sockets: '1', threads: '1' } },
      type: 'desktop',
    },
  }))

  const templateServer = fromJS(Transforms.Template.toInternal({
    template: {
      id: '#template_server',
      cpu: { architecture: 'x86_64', topology: { cores: '1', sockets: '1', threads: '1' } },
      type: 'server',
    },
  }))

  function buildDisk (storageDomain, diskType) {
    return fromJS({
      ...storageDomain.getIn(['diskTypeToDiskAttributes', diskType]).toJS(),
      storageDomainId: storageDomain.get('id'),
    })
  }

  //
  // Test if any **Desktop** in part of the chain
  //
  describe('test when the template and/or the VM is optimizedFor/type is "desktop"', () => {
    test('[desktop, desktop], disk is preallocated, stays on the same NFS storage domain -> cow/sparse', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainNfs, 'pre'),
        template: templateDesktop,
        vmIsDesktop: true,
        vmStorageAllocationIsThin: true,
        targetSD: storageDomainNfs,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ format: 'cow', sparse: true })
    })

    test('[server, desktop], disk is preallocated, stays on same NFS storage domain -> cow/sparse', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainNfs, 'pre'),
        template: templateServer,
        vmIsDesktop: true,
        vmStorageAllocationIsThin: true,
        targetSD: storageDomainNfs,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ format: 'cow', sparse: true })
    })

    test('[desktop, server] disk is preallocated, stays on same NFS storage domain -> cow/sparse', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainNfs, 'pre'),
        template: templateDesktop,
        vmIsDesktop: false,
        vmStorageAllocationIsThin: false,
        targetSD: storageDomainNfs,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ format: 'cow', sparse: true })
    })

    test('[desktop, desktop], disk is thin, stays on the same NFS storage domain -> cow/sparse', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainNfs, 'thin'),
        template: templateDesktop,
        vmIsDesktop: true,
        vmStorageAllocationIsThin: true,
        targetSD: storageDomainNfs,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ format: 'cow', sparse: true })
    })

    test('[server, desktop], disk is thin, stays on the same NFS storage domain -> cow/sparse', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainNfs, 'thin'),
        template: templateServer,
        vmIsDesktop: true,
        vmStorageAllocationIsThin: true,
        targetSD: storageDomainNfs,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ format: 'cow', sparse: true })
    })

    test('[desktop, server], disk is thin, stays on the same NFS storage domain -> cow/sparse', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainNfs, 'thin'),
        template: templateDesktop,
        vmIsDesktop: false,
        vmStorageAllocationIsThin: false,
        targetSD: storageDomainNfs,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ format: 'cow', sparse: true })
    })
  })

  //
  // Test Server -> Server where format stays the same
  //
  describe('test when both the template and the VM is optimizedFor/type is NOT "desktop" (i.e. [server, server])', () => {
    test('disk is thin, stays on the same NFS storage domain -> {} / no changes', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainNfs, 'thin'),
        template: templateServer,
        vmIsDesktop: false,
        vmStorageAllocationIsThin: false,
        targetSD: storageDomainNfs,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ })
    })

    test('disk is preallocated, stays on the same NFS storage domain -> {} / no changes', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainNfs, 'pre'),
        template: templateServer,
        vmIsDesktop: false,
        vmStorageAllocationIsThin: false,
        targetSD: storageDomainNfs,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ })
    })

    test('disk is thin, stays on the same ISCSI storage domain -> {} / no changes', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainIscsi, 'thin'),
        template: templateServer,
        vmIsDesktop: false,
        vmStorageAllocationIsThin: false,
        targetSD: storageDomainIscsi,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ })
    })

    test('disk is preallocated, stays on the same ISCSI storage domain -> {} / no changes', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainIscsi, 'pre'),
        template: templateServer,
        vmIsDesktop: false,
        vmStorageAllocationIsThin: false,
        targetSD: storageDomainIscsi,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ })
    })
  })

  describe('test when changing storage domains (forcing disk clone)', () => {
    test('[server, server], disk is thin, changing from NFS storage domain to ISCSI storage domain -> raw/!sparse', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainNfs, 'thin'),
        template: templateServer,
        vmIsDesktop: false,
        vmStorageAllocationIsThin: false,
        targetSD: storageDomainIscsi,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ format: 'raw', sparse: false })
    })

    test('[server, server], disk is thin, changing from ISCSI storage domain to NFS storage domain -> {} / no changes', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainIscsi, 'thin'),
        template: templateServer,
        vmIsDesktop: false,
        vmStorageAllocationIsThin: false,
        targetSD: storageDomainNfs,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ })
    })

    test('[server, server], disk is preallocated, changing from NFS storage domain to ISCSI storage domain -> {} / no changes', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainNfs, 'pre'),
        template: templateServer,
        vmIsDesktop: false,
        vmStorageAllocationIsThin: false,
        targetSD: storageDomainIscsi,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ })
    })

    test('[server, server], disk is preallocated, changing from ISCSI storage domain to NFS storage domain -> {} / no changes', () => {
      const changes = determineTemplateDiskFormatAndSparse({
        templateDisk: buildDisk(storageDomainIscsi, 'pre'),
        template: templateServer,
        vmIsDesktop: false,
        vmStorageAllocationIsThin: false,
        targetSD: storageDomainNfs,
        targetCluster: cluster,
      })

      expect(changes).toEqual({ })
    })
  })
})
