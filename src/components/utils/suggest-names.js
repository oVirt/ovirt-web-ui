import { isNumber } from '_/utils'

/**
 * Given a VM name and the VM's existing disks, suggest the name for a new Disk.
 *
 * @param {*} vmName VM's name
 * @param {*} existingDisks Array of the VM's existing disks or disk names
 */
export function suggestDiskName (vmName, existingDisks = []) {
  const regex = new RegExp(`^${vmName}_Disk(\\d+)$`)

  let biggestNumber = 0
  for (const disk of existingDisks) {
    const diskName = disk.name || disk
    const [, number] = regex.exec(diskName) || []
    if (isNumber(number)) {
      biggestNumber = Math.max(biggestNumber, parseInt(number, 10))
    }
  }

  const nextDiskName = vmName + '_Disk' + (biggestNumber + 1)
  return nextDiskName
}

/*
 * Search the VM's current NIC names and return the next unused numbered NIC name.
 *
 * @param {*} existingNics Array of the VM's existing nics or nic names
 */
export function suggestNicName (existingNics = []) {
  const regex = new RegExp(`^nic(\\d+)$`)
  let biggestNumber = 0

  for (const nic of existingNics) {
    const nicName = nic.name || nic
    const [, number] = regex.exec(nicName) || []
    if (isNumber(number)) {
      biggestNumber = Math.max(biggestNumber, parseInt(number, 10))
    }
  }

  return `nic${biggestNumber + 1}`
}
