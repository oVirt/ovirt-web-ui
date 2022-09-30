import PropTypes from 'prop-types'

export const BASIC_DATA_SHAPE = {
  name: PropTypes.string,
  description: PropTypes.string,
  dataCenterId: PropTypes.string,
  clusterId: PropTypes.string,

  provisionSource: PropTypes.oneOf(['iso', 'template']),
  isoImage: PropTypes.string,
  templateId: PropTypes.string,
  templateClone: PropTypes.bool,

  operatingSystemId: PropTypes.string,
  tpmEnabled: PropTypes.bool,
  memory: PropTypes.number, // in MiB
  cpus: PropTypes.number,
  optimizedFor: PropTypes.oneOf(['desktop', 'server', 'high_performance']),

  startOnCreation: PropTypes.bool,

  cloudInitEnabled: PropTypes.bool,
  initHostname: PropTypes.string,
  initSshKeys: PropTypes.string,
  initTimezone: PropTypes.string,
  initAdminPassword: PropTypes.string,
  initCustomScript: PropTypes.string,

  topology: PropTypes.exact({
    cores: PropTypes.number.isRequired,
    sockets: PropTypes.number.isRequired,
    threads: PropTypes.number.isRequired,
  }),
}

// interface is subset of: http://ovirt.github.io/ovirt-engine-api-model/master/#types/nic_interface
export const NIC_SHAPE = {
  id: PropTypes.string,
  name: PropTypes.string,
  vnicProfileId: PropTypes.string,
  deviceType: PropTypes.string, // interface: [ virtio | rtl8139 | e1000 | e1000e ]
  isFromTemplate: PropTypes.bool,
}

export const STORAGE_SHAPE = {
  id: PropTypes.string, // diskAttachmentId
  name: PropTypes.string,

  diskId: PropTypes.string, // diskId (only for existing )
  storageDomainId: PropTypes.string,

  bootable: PropTypes.bool,
  format: PropTypes.string, // [ cow | raw ]
  size: PropTypes.number, // bytes
  isFromTemplate: PropTypes.bool,
}
