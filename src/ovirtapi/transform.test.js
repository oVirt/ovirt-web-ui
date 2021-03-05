/* eslint-env jest */

import { VmStatistics } from './transform'

/*
 * test.each data table:
 *  [
 *    [ 'test title', input ApiVmStatisticType, expected partial VmStatisticsType ],
 *    [ 'test title', input ApiVmStatisticType, expected partial VmStatisticsType ],
 *    ...
 *  ]
 *
 * NOTE, The ovirt-engine REST API generates statistics for a VM in this Java code:
 *       https://github.com/oVirt/ovirt-engine/blob/master/backend/manager/modules/restapi/jaxrs/src/main/java/org/ovirt/engine/api/restapi/resource/VmStatisticalQuery.java
 */
const TRANSFORM_TESTS = [
  [
    'counter, integer - elapsed.time',
    {
      id: '3',
      kind: 'counter',
      type: 'integer',
      unit: 'seconds',
      values: {
        value: [
          { datum: 1670253 },
        ],
      },
      name: 'elapsed.time',
      description: 'Elapsed VM runtime',
    },
    {
      elapsedUptime: { firstDatum: 1670253, datum: [1670253], unit: 'seconds', description: 'Elapsed VM runtime' },
    },
  ],

  [
    'gauge, string - disks.usage for a stopped VM (or without a guest agent) ',
    {
      id: '2',
      kind: 'gauge',
      type: 'string',
      unit: 'none',
      values: {},
      name: 'disks.usage',
      description: 'Disk usage, in bytes, per filesystem as JSON (agent)',
    },
    {
      disks: {
        usage: {
          firstDatum: undefined,
          datum: undefined,
          unit: 'none',
          description: 'Disk usage, in bytes, per filesystem as JSON (agent)',
        },
      },
    },
  ],

  [
    'gauge, string - disks.usage parsed for a running VM with a guest agent',
    {
      id: '2',
      kind: 'gauge',
      type: 'string',
      unit: 'none',
      values: {
        value: [
          {
            detail: '[{"path":"/boot","total":"952840192","used":"100130816","fs":"ext4"},{"path":"/run/media/sdickers/Fedora-SB-ostree-x86_64-33","total":"2874408960","used":"2874408960","fs":"iso9660"}]',
          },
        ],
      },
      name: 'disks.usage',
      description: 'Disk usage, in bytes, per filesystem as JSON (agent)',
    },
    {
      disks: {
        usage: {
          firstDatum: { path: '/boot', total: 952840192, used: 100130816, fs: 'ext4' },
          datum: [
            { path: '/boot', total: 952840192, used: 100130816, fs: 'ext4' },
            { path: '/run/media/sdickers/Fedora-SB-ostree-x86_64-33', total: 2874408960, used: 2874408960, fs: 'iso9660' },
          ],
          unit: 'none',
          description: 'Disk usage, in bytes, per filesystem as JSON (agent)',
        },
      },
    },
  ],

  [
    'gauge, integer, bytes, single datum - memory.installed',
    {
      id: '0',
      kind: 'gauge',
      type: 'integer',
      unit: 'bytes',
      values: {
        value: [
          { datum: 1073741824 },
        ],
      },
      name: 'memory.installed',
      description: 'Total memory configured',
    },
    {
      memory: {
        installed: {
          firstDatum: 1073741824,
          datum: [1073741824],
          unit: 'bytes',
          description: 'Total memory configured',
        },
      },
    },
  ],

  [
    'gauge, integer, bytes, single datum - memory.used',
    {
      id: '0',
      kind: 'gauge',
      type: 'integer',
      unit: 'bytes',
      values: {
        value: [
          { datum: 1073741824 },
        ],
      },
      name: 'memory.used',
      description: 'Memory used (agent)',
    },
    {
      memory: {
        used: {
          firstDatum: 1073741824,
          datum: [1073741824],
          unit: 'bytes',
          description: 'Memory used (agent)',
        },
      },
    },
  ],

  [
    'gauge, integer, bytes, single datum - memory.free',
    {
      id: '11',
      kind: 'gauge',
      type: 'integer',
      unit: 'bytes',
      values: {
        value: [
          {
            datum: 702443520,
          },
        ],
      },
      name: 'memory.free',
      description: 'Memory free (agent)',
    },
    {
      memory: {
        free: {
          firstDatum: 702443520,
          datum: [702443520],
          unit: 'bytes',
          description: 'Memory free (agent)',
        },
      },
    },
  ],

  [
    'gauge, integer, bytes, single datum - memory.buffered',
    {
      id: '10',
      kind: 'gauge',
      type: 'integer',
      unit: 'bytes',
      values: {
        value: [
          { datum: 2158592 },
        ],
      },
      name: 'memory.buffered',
      description: 'Memory buffered (agent)',
    },
    {
      memory: {
        buffered: {
          firstDatum: 2158592,
          datum: [2158592],
          unit: 'bytes',
          description: 'Memory buffered (agent)',
        },
      },
    },
  ],

  [
    'gauge, decimal, percent, multiple datum - memory.usage.history for a stopped VM',
    {
      id: '4',
      kind: 'gauge',
      type: 'decimal',
      unit: 'percent',
      values: {},
      name: 'memory.usage.history',
      description: 'List of memory usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
    },
    {
      memory: {
        'usage.history': {
          firstDatum: undefined,
          datum: undefined,
          unit: 'percent',
          description: 'List of memory usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
        },
      },
    },
  ],

  [
    'gauge, decimal, percent, multiple datum - memory.usage.history for a running VM',
    {
      id: '4',
      kind: 'gauge',
      type: 'decimal',
      unit: 'percent',
      values: {
        value: [
          { datum: 1 },
          { datum: 2 },
          { datum: 3 },
        ],
      },
      name: 'memory.usage.history',
      description: 'List of memory usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
    },
    {
      memory: {
        'usage.history': {
          firstDatum: 1,
          datum: [1, 2, 3],
          unit: 'percent',
          description: 'List of memory usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
        },
      },
    },
  ],

  [
    'gauge, decimal, percent, single datum - cpu.current.total',
    {
      id: '1',
      kind: 'gauge',
      type: 'decimal',
      unit: 'percent',
      values: {
        value: [
          { datum: 0.61 },
        ],
      },
      name: 'cpu.current.total',
      description: 'Total CPU used',
    },
    {
      cpu: {
        'current.total': {
          firstDatum: 0.61,
          datum: [0.61],
          unit: 'percent',
          description: 'Total CPU used',
        },
      },
    },
  ],

  [
    'gauge, decimal, percent, single datum - cpu.current.guest',
    {
      id: '6',
      kind: 'gauge',
      type: 'decimal',
      unit: 'percent',
      values: {
        value: [
          {
            datum: 0.74,
          },
        ],
      },
      name: 'cpu.current.guest',
      description: 'CPU used by guest',
    },
    {
      cpu: {
        'current.guest': {
          firstDatum: 0.74,
          datum: [0.74],
          unit: 'percent',
          description: 'CPU used by guest',
        },
      },
    },
  ],

  [
    'gauge, decimal, percent, single datum - cpu.current.hypervisor',
    {
      id: '7',
      kind: 'gauge',
      type: 'decimal',
      unit: 'percent',
      values: {
        value: [
          {
            datum: 0.74,
          },
        ],
      },
      name: 'cpu.current.hypervisor',
      description: 'CPU overhead',
    },
    {
      cpu: {
        'current.hypervisor': {
          firstDatum: 0.74,
          datum: [0.74],
          unit: 'percent',
          description: 'CPU overhead',
        },
      },
    },
  ],

  [
    'gauge, decimal, percent, multiple datum - cpu.usage.history for a stopped VM',
    {
      id: '13',
      kind: 'gauge',
      type: 'decimal',
      unit: 'percent',
      values: {},
      name: 'cpu.usage.history',
      description: 'List of CPU usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
    },
    {
      cpu: {
        'usage.history': {
          firstDatum: undefined,
          datum: undefined,
          unit: 'percent',
          description: 'List of CPU usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
        },
      },
    },
  ],

  [
    'gauge, decimal, percent, multiple datum - cpu.usage.history for a running VM',
    {
      id: '13',
      kind: 'gauge',
      type: 'decimal',
      unit: 'percent',
      values: {
        value: [
          { datum: 99 },
          { datum: 99 },
          { datum: 5 },
          { datum: 5 },
          { datum: 12 },
          { datum: 2 },
        ],
      },
      name: 'cpu.usage.history',
      description: 'List of CPU usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
    },
    {
      cpu: {
        'usage.history': {
          firstDatum: 99,
          datum: [99, 99, 5, 5, 12, 2],
          unit: 'percent',
          description: 'List of CPU usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
        },
      },
    },
  ],

  [
    'gauge, decimal, percent, single datum - migration.progress (not captured, so expect stats base)',
    {
      id: '9',
      kind: 'gauge',
      type: 'decimal',
      unit: 'percent',
      values: {
        value: [
          { datum: 0 },
        ],
      },
      name: 'migration.progress',
      description: 'Migration Progress',
    },
    { memory: {}, cpu: {}, network: {}, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
  ],

  [
    'gauge, decimal, percent, single datum - network.current.total',
    {
      id: '12',
      kind: 'gauge',
      type: 'decimal',
      unit: 'percent',
      values: {
        value: [
          { datum: 0 },
        ],
      },
      name: 'network.current.total',
      description: 'Total network used',
    },
    {
      network: {
        'current.total': {
          firstDatum: 0,
          datum: [0],
          unit: 'percent',
          description: 'Total network used',
        },
      },
    },
  ],

  [
    'gauge, decimal, percent, multiple datum - network.usage.history for a stopped VM',
    {
      id: '14',
      kind: 'gauge',
      type: 'decimal',
      unit: 'percent',
      values: {},
      name: 'network.usage.history',
      description: 'List of CPU usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
    },
    {
      network: {
        'usage.history': {
          firstDatum: undefined,
          datum: undefined,
          unit: 'percent',
          description: 'List of CPU usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
        },
      },
    },
  ],

  [
    'gauge, decimal, percent, multiple datum - network.usage.history for a running VM',
    {
      id: '14',
      kind: 'gauge',
      type: 'decimal',
      unit: 'percent',
      values: {
        value: [
          { datum: 0 },
          { datum: 1 },
          { datum: 2 },
          { datum: 3 },
          { datum: 4 },
          { datum: 5 },
        ],
      },
      name: 'network.usage.history',
      description: 'List of CPU usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
    },
    {
      network: {
        'usage.history': {
          firstDatum: 0,
          datum: [0, 1, 2, 3, 4, 5],
          unit: 'percent',
          description: 'List of CPU usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
        },
      },
    },
  ],
]

describe('Test transform.js VmStatistics.toInternal()', () => {
  const base = {
    cpu: {},
    disks: {},
    elapsedUptime: { 'datum': [0], 'description': 'Elapsed VM runtime (default to 0)', 'firstDatum': undefined, 'unit': 'seconds' },
    memory: {},
    network: {},
  }

  test('no input gives the base/empty stats', () => {
    expect(VmStatistics.toInternal()).toEqual(base)
  })

  test('empty input gives the base/empty stats', () => {
    expect(VmStatistics.toInternal({})).toEqual(base)
  })

  test('empty statistics gives the base/empty stats', () => {
    expect(VmStatistics.toInternal({ statistics: [] })).toEqual(base)
  })

  test.each(TRANSFORM_TESTS)(
    'transform test [%s]',
    (title, apiInput, expectedTransformPart) => {
      const result = VmStatistics.toInternal({ statistics: [ apiInput ] })
      expect(result).toMatchObject(expectedTransformPart)
    }
  )
})
