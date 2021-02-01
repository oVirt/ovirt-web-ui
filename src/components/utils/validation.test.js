/* eslint-env jest */
import {
  isHostNameValid,
  isVmNameValid,
  isNicNameValid,
  isNicNameUnique,
  isDiskNameValid,
} from './validation'

describe('check host names', function () {
  it('valid host names', function () {
    expect(isHostNameValid('a')).toEqual(true)
    expect(isHostNameValid('a1')).toEqual(true)
    expect(isHostNameValid('abcd-1')).toEqual(true)
    expect(isHostNameValid('abc_.d-1')).toEqual(true)
    expect(isHostNameValid('AC.DC')).toEqual(true)
    expect(isHostNameValid('a'.repeat(255))).toEqual(true) // 255 characters
  })

  it('invalid host names', function () {
    expect(isHostNameValid('..0_ 0..')).toEqual(false)
    expect(isHostNameValid('!A_b')).toEqual(false)
    expect(isHostNameValid('#-abc')).toEqual(false)
    expect(isHostNameValid('Кирилиця')).toEqual(false)
    expect(isHostNameValid('a'.repeat(255) + '1')).toEqual(false) // 256 characters
  })
})

describe('check disk names', function () {
  it('valid disk names', function () {
    expect(isDiskNameValid('a'.repeat(255))).toEqual(true)
    expect(isDiskNameValid('a')).toEqual(true)
    expect(isDiskNameValid('a1')).toEqual(true)
    expect(isDiskNameValid('abcd-1')).toEqual(true)
    expect(isDiskNameValid('..0_0..')).toEqual(true)
    expect(isDiskNameValid('A_b')).toEqual(true)
    expect(isDiskNameValid('AC.DC')).toEqual(true)
    expect(isDiskNameValid('-abc')).toEqual(true)
    expect(isDiskNameValid('Кирилиця')).toEqual(true)
  })

  it('invalid disk names', function () {
    expect(isDiskNameValid('')).toEqual(false)
    expect(isDiskNameValid('a b')).toEqual(false)
    expect(isDiskNameValid('a!@$b298')).toEqual(false)
    expect(isDiskNameValid('a_name()')).toEqual(false)
    expect(isDiskNameValid('a'.repeat(255) + '1')).toEqual(false) // 256 characters
  })
})

describe('check VM names', function () {
  it('valid VM names', function () {
    expect(isVmNameValid('a')).toEqual(true)
    expect(isVmNameValid('a1')).toEqual(true)
    expect(isVmNameValid('aBcD-1')).toEqual(true)
    expect(isVmNameValid('..0_0..')).toEqual(true)
    expect(isVmNameValid('--Foo--')).toEqual(true)
    expect(isVmNameValid('__baR__')).toEqual(true)
    expect(isVmNameValid('Кирилиця')).toEqual(true)
    expect(isVmNameValid('a'.repeat(64))).toEqual(true) // 64 characters
  })

  it('invalid VM names', function () {
    expect(isVmNameValid('A+b')).toEqual(false)
    expect(isVmNameValid('AC/DC')).toEqual(false)
    expect(isVmNameValid('  abc  ')).toEqual(false)
    expect(isVmNameValid('a'.repeat(64) + '1')).toEqual(false) // 65 characters
  })
})

describe('check NIC names', function () {
  it('valid NIC names', function () {
    expect(isNicNameValid('SomeName')).toEqual(true)
    expect(isNicNameValid('1Ab')).toEqual(true)
    expect(isNicNameValid('A_c')).toEqual(true)
    expect(isNicNameValid('c1-b')).toEqual(true)
    expect(isNicNameValid('A10-_.b')).toEqual(true)
    expect(isNicNameValid('a'.repeat(50))).toEqual(true) // 50 characters
  })
  it('invalid NIC names ', function () {
    expect(isNicNameValid('SomeBadName?')).toEqual(false)
    expect(isNicNameValid('The Worst name Ever!')).toEqual(false)
    expect(isNicNameValid('')).toEqual(false)
    expect(isNicNameValid('N@me$)')).toEqual(false)
    expect(isNicNameValid('A1 b1')).toEqual(false)
    expect(isNicNameValid('a'.repeat(50) + '1')).toEqual(false) // 51 characters
  })
})
describe('check NIC name uniqueness', function () {
  const nicList = [
    { id: '1', name: 'nic1' },
    { id: '2', name: 'nic2' },
    { id: '3', name: 'nic3' },
    { id: '4', name: 'nic4' },
  ]
  it('duplicate name on create new NIC', function () {
    expect(isNicNameUnique(nicList, { id: 'a', name: 'nic4' })).toEqual(false)
  })
  it('duplicate name on update NIC', function () {
    expect(isNicNameUnique(nicList, { id: '4', name: 'nic3' })).toEqual(false)
  })
  it('unique name on update NIC same name', function () {
    expect(isNicNameUnique(nicList, nicList[3])).toEqual(true)
  })
  it('unique name on update NIC new name', function () {
    expect(isNicNameUnique(nicList, { id: '4', name: 'nic5' })).toEqual(true)
  })
  it('unique name on create new NIC', function () {
    expect(isNicNameUnique(nicList, { id: '5', name: 'nic5' })).toEqual(true)
  })
})
