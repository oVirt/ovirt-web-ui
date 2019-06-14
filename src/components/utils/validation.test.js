/* eslint-env jest */
import { isHostNameValid, isVmNameValid } from './validation'

describe('check host names', function () {
  it('valid host names', function () {
    expect(isHostNameValid('a')).toEqual(true)
    expect(isHostNameValid('a1')).toEqual(true)
    expect(isHostNameValid('abcd-1')).toEqual(true)
  })

  it('invalid host names', function () {
    expect(isHostNameValid('..0_0..')).toEqual(false)
    expect(isHostNameValid('A_b')).toEqual(false)
    expect(isHostNameValid('AC.DC')).toEqual(false)
    expect(isHostNameValid('-abc')).toEqual(false)
    expect(isHostNameValid('Кирилиця')).toEqual(false)
    expect(isHostNameValid('veryveryveryveryveryveryveryveryveryveryveryveryveryveryverylongname')).toEqual(false)
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
  })

  it('invalid VM names', function () {
    expect(isVmNameValid('A+b')).toEqual(false)
    expect(isVmNameValid('AC/DC')).toEqual(false)
    expect(isVmNameValid('  abc  ')).toEqual(false)
    expect(isVmNameValid('veryveryveryveryveryveryveryveryveryveryveryveryveryveryverylongname')).toEqual(false)
  })
})
