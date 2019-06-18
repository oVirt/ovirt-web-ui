/* eslint-env jest */
import { getTopology } from './cpu-topology'

describe('check topology balance', function () {
  it('topology without predefined values', function () {
    const topologies = [
      {
        input: { value: 18, max: { sockets: 16, cores: 250, threads: 8 } },
        output: { sockets: 9, cores: 2, threads: 1 },
      },
      {
        input: { value: 180, max: { sockets: 16, cores: 250, threads: 8 } },
        output: { sockets: 15, cores: 12, threads: 1 },
      },
      {
        input: { value: 60, max: { sockets: 16, cores: 250, threads: 8 } },
        output: { sockets: 15, cores: 4, threads: 1 },
      },
      {
        input: { value: 50, max: { sockets: 16, cores: 250, threads: 8 } },
        output: { sockets: 10, cores: 5, threads: 1 },
      },
      {
        input: { value: 71, max: { sockets: 16, cores: 250, threads: 8 } },
        output: { sockets: 1, cores: 71, threads: 1 },
      },
    ]
    for (let topology of topologies) {
      expect(getTopology(topology.input)).toEqual(topology.output)
    }
  })
  it('topology with predefined values', function () {
    const topologies = [
      {
        input: { value: 18, max: { sockets: 16, cores: 250, threads: 8 }, force: { sockets: 3 } },
        output: { sockets: 3, cores: 6, threads: 1 },
      },
      {
        input: { value: 180, max: { sockets: 16, cores: 250, threads: 8 }, force: { cores: 20 } },
        output: { sockets: 9, cores: 20, threads: 1 },
      },
      {
        input: { value: 60, max: { sockets: 16, cores: 250, threads: 8 }, force: { threads: 6 } },
        output: { sockets: 10, cores: 1, threads: 6 },
      },
      {
        input: { value: 50, max: { sockets: 16, cores: 250, threads: 8 }, force: { sockets: 50 } },
        output: { sockets: 10, cores: 5, threads: 1 },
      },
    ]
    for (let topology of topologies) {
      expect(getTopology(topology.input)).toEqual(topology.output)
    }
  })
})
