export const vms = {
  'vm': [
    {
      'next_run_configuration_exists': 'false',
      'numa_tune_mode': 'interleave',
      'status': 'down',
      'stop_time': 1491921599642,
      'name': 'win1',
      'id': '123',
      'bios': {
        'boot_menu': {
          'enabled': 'false'
        }
      },
      'cpu': {
        'architecture': 'x86_64',
        'topology': {
          'cores': '1',
          'sockets': '1',
          'threads': '1'
        }
      },
      'io': {
        'threads': '0'
      },
      'memory': 1073741824,
      'migration': {
        'auto_converge': 'inherit',
        'compressed': 'inherit'
      },
      'origin': 'ovirt',
      'os': {
        'boot': {
          'devices': {
            'device': [ 'network' ]
          }
        },
        'type': 'windows_7'
      },
      'sso': {
        'methods': {
          'method': [ {
            'id': 'guest_agent'
          } ]
        }
      },
      'stateless': 'false',
      'type': 'desktop',
      'usb': {
        'enabled': 'false'
      },
      'cluster': {
        'id': '147'
      },
      'quota': {
        'id': '258'
      },
      'cpu_shares': '0',
      'creation_time': 1490266328973,
      'delete_protected': 'false',
      'high_availability': {
        'enabled': 'false',
        'priority': '1'
      },
      'large_icon': {
        'id': '369'
      },
      'memory_policy': {
        'guaranteed': 1073741824,
        'max': 4294967296
      },
      'migration_downtime': '-1',
      'small_icon': {
        'id': '753'
      },
      'start_paused': 'false',
      'time_zone': {
        'name': 'GMT Standard Time'
      },
      'cpu_profile': {
        'id': '357'
      },
      'graphics_console': [ {
        'protocol': 'spice',
        'vm': {
          'id': '123'
        },
        'id': '123456'
      } ],
      'diskattachments': {},
    },
    {
      'next_run_configuration_exists': 'false',
      'numa_tune_mode': 'interleave',
      'status': 'down',
      'stop_time': 1492007085568,
      'actions': {},
      'name': 'vm1',
      'id': '456',
      'bios': {
        'boot_menu': {
          'enabled': 'false'
        }
      },
      'cpu': {
        'architecture': 'x86_64',
        'topology': {
          'cores': '1',
          'sockets': '1',
          'threads': '1'
        }
      },
      'io': {
        'threads': '0'
      },
      'memory': 1073741824,
      'migration': {
        'auto_converge': 'inherit',
        'compressed': 'inherit'
      },
      'origin': 'ovirt',
      'os': {
        'boot': {
          'devices': {
            'device': [ 'network' ]
          }
        },
        'type': 'other'
      },
      'sso': {
        'methods': {
          'method': [ {
            'id': 'guest_agent'
          } ]
        }
      },
      'stateless': 'false',
      'type': 'desktop',
      'usb': {
        'enabled': 'false'
      },
      'cluster': {
        'id': '147'
      },
      'cpu_shares': '0',
      'creation_time': 1489590040207,
      'delete_protected': 'false',
      'high_availability': {
        'enabled': 'false',
        'priority': '1'
      },
      'large_icon': {
        'id': '159'
      },
      'memory_policy': {
        'guaranteed': 1073741824,
        'max': 4294967296
      },
      'migration_downtime': '-1',
      'small_icon': {
        'id': '248'
      },
      'start_paused': 'false',
      'time_zone': {
        'name': 'Etc/GMT'
      },
      'cpu_profile': {
        'id': '862'
      },
      'graphics_console': [ {
        'protocol': 'vnc',
        'vm': {
          'href': '/ovirt-engine/api/vms/456',
          'id': '456'
        },
        'id': '456789'
      } ],
      'diskattachments': {},
    }
  ],
}

export const disks = {
  'disk': [
    {
      'actual_size': 200704,
      'alias': 'vm2_Disk1',
      'format': 'cow',
      'propagate_errors': 'false',
      'provisioned_size': 1073741824,
      'qcow_version': 'qcow2_v3',
      'shareable': 'false',
      'sparse': 'true',
      'status': 'ok',
      'storage_type': 'image',
      'wipe_after_delete': 'false',
      'name': 'vm2_Disk1',
      'id': '123',
    },
    {
      'actual_size': 200704,
      'alias': 'vm2_Disk1',
      'format': 'cow',
      'propagate_errors': 'false',
      'provisioned_size': 1073741824,
      'qcow_version': 'qcow2_v3',
      'shareable': 'false',
      'sparse': 'true',
      'status': 'ok',
      'storage_type': 'image',
      'wipe_after_delete': 'false',
      'name': 'vm2_Disk1',
      'id': '456',
    },
    {
      'actual_size': 0,
      'alias': 'vm2_Disk1',
      'format': 'raw',
      'propagate_errors': 'false',
      'provisioned_size': 1073741824,
      'qcow_version': 'qcow2_v3',
      'shareable': 'false',
      'sparse': 'true',
      'status': 'ok',
      'storage_type': 'image',
      'wipe_after_delete': 'false',
      'name': 'vm2_Disk1',
      'id': '789',
    },
  ]
}

export const api = {
  'product_info': {
    'name': 'oVirt Engine',
    'vendor': 'ovirt.org',
    'version': {
      'build': '0',
      'full_version': '4.2.0-0.0.master.20170314212741.gite586160.el7.centos',
      'major': '4',
      'minor': '2',
      'revision': '0'
    }
  },
  'special_objects': {
    'blank_template': {
      'id': '000'
    },
    'root_tag': {
      'id': '000'
    }
  },
  'summary': {},
  'time': 1492602875319,
}
