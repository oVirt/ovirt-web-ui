// @flow
import { dividers } from '_/utils'

export function getTopology ({
  value,
  max,
  force,
}: {
  value: number,
  max: {
    sockets: number,
    cores: number,
    threads: number
  },
  force?: {
    sockets?: number,
    cores?: number,
    threads?: number
  }
}): { sockets: number, cores: number, threads: number } {
  const forceKey = force ? Object.keys(force) : []
  const topology = {}
  let topologyArr = ['sockets', 'cores', 'threads'].sort((a, b) => forceKey.indexOf(a) > -1 ? -1 : forceKey.indexOf(b) > -1 ? 1 : 0)

  let cpuValue = value
  let divsOfValue = []
  for (let t of topologyArr) {
    divsOfValue = dividers(cpuValue).filter(x => x <= max[t])
    topology[t] = divsOfValue[divsOfValue.length - 1]
    if (force && force[t] && divsOfValue.indexOf(force[t]) > -1) {
      topology[t] = force[t]
    }
    cpuValue /= topology[t]
  }
  return topology
}

export function getTopologyPossibleValues ({
  value,
  maxNumOfSockets,
  maxNumOfCores,
  maxNumOfThreads,
}: {
  value: number,
  maxNumOfSockets: number,
  maxNumOfCores: number,
  maxNumOfThreads: number
}): { sockets: Array<number>, cores: Array<number>, threads: Array<number> } {
  let sockets = dividers(value).filter(x => x <= maxNumOfSockets)
  let cores = dividers(value).filter(x => x <= maxNumOfCores)
  let threads = dividers(value).filter(x => x <= maxNumOfThreads)

  return { sockets, cores, threads }
}
