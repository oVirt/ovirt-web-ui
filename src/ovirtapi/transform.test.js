/* eslint-env jest */

import { VmStatistics } from './transform'

const TESTS_DATA = {
  title: 'Test transform.js VmStatistics.toInternal ',
  testCases: [
    {
      title: 'test case 0',
      test: [
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
      ],
      expect: { memory: { installed: { firstDatum: 1073741824, datum: [1073741824], unit: 'bytes', description: 'Total memory configured' } }, cpu: {}, network: {}, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
    },
    {
      title: 'test case 1',
      test: [
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
      ],
      expect: { memory: {}, cpu: { 'current.total': { firstDatum: 0.61, datum: [0.61], unit: 'percent', description: 'Total CPU used' } }, network: {}, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
    },
    {
      title: 'test case 2',
      test: [
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
      ],
      expect: {
        memory: {}, cpu: {}, network: {}, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: { usage: { firstDatum: { path: '/boot', total: 952840192, used: 100130816, fs: 'ext4' }, datum: [{ path: '/boot', total: 952840192, used: 100130816, fs: 'ext4' }, { path: '/run/media/sdickers/Fedora-SB-ostree-x86_64-33', total: 2874408960, used: 2874408960, fs: 'iso9660' }], unit: 'none', description: 'Disk usage, in bytes, per filesystem as JSON (agent)' } } },
    },
    {
      title: 'test case 3',
      test: [
        {
          id: '3',
          kind: 'counter',
          type: 'integer',
          unit: 'seconds',
          values: {
            value: [
              {
                datum: 1670253,
              },
            ],
          },
          name: 'elapsed.time',
          description: 'Elapsed VM runtime',
        },
      ],
      expect: { memory: {}, cpu: {}, network: {}, elapsedUptime: { firstDatum: 1670253, datum: [1670253], unit: 'seconds', description: 'Elapsed VM runtime' }, disks: {} },
    },
    {
      title: 'test case 4',
      test: [
        {
          id: '4',
          kind: 'gauge',
          type: 'decimal',
          unit: 'percent',
          values: {
            value: [
              {
                datum: 1,
              },
              {
                datum: 2,
              },
              {
                datum: 3,
              },
            ],
          },
          name: 'memory.usage.history',
          description: 'List of memory usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
        },
      ],
      expect: { memory: { 'usage.history': { firstDatum: 1, datum: [1, 2, 3], unit: 'percent', description: 'List of memory usage history, sorted by date from newest to oldest, at intervals of 30 seconds' } }, cpu: {}, network: {}, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
    },
    {
      title: 'test case 5',
      test: [
        {
          id: '5',
          kind: 'gauge',
          type: 'integer',
          unit: 'bytes',
          values: {
            value: [
              {
                datum: 268435456,
              },
            ],
          },
          name: 'memory.used.history',
          description: 'Memory used (agent)',
        },
      ],
      expect: { memory: { 'used.history': { firstDatum: 268435456, datum: [268435456], unit: 'bytes', description: 'Memory used (agent)' } }, cpu: {}, network: {}, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
    },
    {
      title: 'test case 6',
      test: [
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
      ],
      expect: { memory: {}, cpu: { 'current.guest': { firstDatum: 0.74, datum: [0.74], unit: 'percent', description: 'CPU used by guest' } }, network: {}, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
    },
    {
      title: 'test case 7',
      test: [
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
      ],
      expect: { memory: {}, cpu: { 'current.hypervisor': { firstDatum: 0.74, datum: [0.74], unit: 'percent', description: 'CPU overhead' } }, network: {}, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
    },
    {
      title: 'test case 8',
      test: [
        {
          id: '8',
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
      ],
      expect: { memory: {}, cpu: { 'current.hypervisor': { firstDatum: 0.74, datum: [0.74], unit: 'percent', description: 'CPU overhead' } }, network: {}, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
    },
    {
      title: 'test case 9',
      test: [
        {
          id: '9',
          kind: 'gauge',
          type: 'decimal',
          unit: 'percent',
          values: {
            value: [
              {
                datum: 0,
              },
            ],
          },
          name: 'migration.progress',
          description: 'Migration Progress',
        },
      ],
      expect: { memory: {}, cpu: {}, network: {}, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
    },
    {
      title: 'test case 10',
      test: [
        {
          id: '10',
          kind: 'gauge',
          type: 'integer',
          unit: 'bytes',
          values: {
            value: [
              {
                datum: 2158592,
              },
            ],
          },
          name: 'memory.buffered',
          description: 'Memory buffered (agent)',
        },
      ],
      expect: { memory: { buffered: { firstDatum: 2158592, datum: [2158592], unit: 'bytes', description: 'Memory buffered (agent)' } }, cpu: {}, network: {}, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
    },
    {
      title: 'test case 11',
      test: [
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
      ],
      expect: { memory: { free: { firstDatum: 702443520, datum: [702443520], unit: 'bytes', description: 'Memory free (agent)' } }, cpu: {}, network: {}, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
    },
    {
      title: 'test case 12',
      test: [
        {
          id: '12',
          kind: 'gauge',
          type: 'decimal',
          unit: 'percent',
          values: {
            value: [
              {
                datum: 0,
              },
            ],
          },
          name: 'network.current.total',
          description: 'Total network used',
        },
      ],
      expect: { memory: {}, cpu: {}, network: { 'current.total': { firstDatum: 0, datum: [0], unit: 'percent', description: 'Total network used' } }, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
    },
    {
      title: 'test case 13',
      test: [
        {
          id: '13',
          kind: 'gauge',
          type: 'decimal',
          unit: 'percent',
          values: {
            value: [
              { datum: 0 },
              { datum: 0 },
              { datum: 0 },
              { datum: 2 },
              { datum: 0 },
              { datum: 0 },
            ],
          },
          name: 'cpu.usage.history',
          description: 'List of CPU usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
        },
      ],
      expect: { memory: {}, cpu: { 'usage.history': { firstDatum: 0, datum: [0, 0, 0, 2, 0, 0], unit: 'percent', description: 'List of CPU usage history, sorted by date from newest to oldest, at intervals of 30 seconds' } }, network: {}, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
    },
    {
      title: 'test case 14',
      test: [
        {
          id: '14',
          kind: 'gauge',
          type: 'decimal',
          unit: 'percent',
          values: {
            value: [
              { datum: 0 },
              { datum: 0 },
              { datum: 0 },
              { datum: 0 },
              { datum: 0 },
              { datum: 0 },
            ],
          },
          name: 'network.usage.history',
          description: 'List of CPU usage history, sorted by date from newest to oldest, at intervals of 30 seconds',
        },
      ],
      expect: { memory: {}, cpu: {}, network: { 'usage.history': { firstDatum: 0, datum: [0, 0, 0, 0, 0, 0], unit: 'percent', description: 'List of CPU usage history, sorted by date from newest to oldest, at intervals of 30 seconds' } }, elapsedUptime: { datum: [0], unit: 'seconds', description: 'Elapsed VM runtime (default to 0)' }, disks: {} },
    },
  ],
}
describe(TESTS_DATA.title, () => {
  describe.each(TESTS_DATA.testCases)('', (testCase) => {
    test(`testing: ${testCase.title}`, () => {
      const result = VmStatistics.toInternal({ statistics: testCase.test })
      expect(result).toEqual(testCase.expect)
    })
  })
})
