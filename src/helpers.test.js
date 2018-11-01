/* eslint-env jest */
import { formatDateFromNow } from 'helpers'

describe('testing formating from now date', function () {
  const nowDate = Date.now()
  it('testing years', function () {
    expect(formatDateFromNow(nowDate - 31536000000)).toEqual('1y ago')
    expect(formatDateFromNow(nowDate - 63072000000)).toEqual('2y ago')
  })

  it('testing months', function () {
    expect(formatDateFromNow(nowDate - 30536000000)).toEqual('11M ago')
    expect(formatDateFromNow(nowDate - 15768000000)).toEqual('6M ago')
  })

  it('testing days', function () {
    expect(formatDateFromNow(nowDate - 86400000)).toEqual('1d ago')
    expect(formatDateFromNow(nowDate - 172800000)).toEqual('2d ago')
  })
  it('testing hours', function () {
    expect(formatDateFromNow(nowDate - 3600000)).toEqual('1h ago')
    expect(formatDateFromNow(nowDate - 7200000)).toEqual('2h ago')
  })
  it('testing minutes', function () {
    expect(formatDateFromNow(nowDate - 60000)).toEqual('1m ago')
    expect(formatDateFromNow(nowDate - 120000)).toEqual('2m ago')
  })
  it('testing seconds', function () {
    expect(formatDateFromNow(nowDate - 10000)).toEqual('10s ago')
    expect(formatDateFromNow(nowDate - 20000)).toEqual('20s ago')
  })
})
