/* eslint-env jest */
import { isHostNameValid } from './utils'

describe('check host names on valid VM names', function () {
  it('valid host names', function () {
    expect(isHostNameValid('a')).toEqual(true)
    expect(isHostNameValid('a1')).toEqual(true)
    expect(isHostNameValid('abcd-1')).toEqual(true)
  })

  it('invalid host names', function () {
    expect(isHostNameValid('A_b')).toEqual(false)
    expect(isHostNameValid('AC.DC')).toEqual(false)
    expect(isHostNameValid('-abc')).toEqual(false)
    expect(isHostNameValid('Кирилиця')).toEqual(false)
    expect(isHostNameValid('veryveryveryveryveryveryveryveryveryveryveryveryveryveryverylongname')).toEqual(false)
  })
})
