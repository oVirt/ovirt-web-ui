/* eslint-env jest */
import { formatDateFromNow, userFormatOfBytes } from '_/helpers'
import { msg } from '_/intl'

describe('testing formating from now date', function () {
  const nowDate = Date.now()
  it('testing years', function () {
    expect(formatDateFromNow(nowDate - 31536000000, msg)).toEqual('1y ago')
    expect(formatDateFromNow(nowDate - 63072000000, msg)).toEqual('2y ago')
  })

  it('testing months', function () {
    expect(formatDateFromNow(nowDate - 30536000000, msg)).toEqual('11M ago')
    expect(formatDateFromNow(nowDate - 15768000000, msg)).toEqual('6M ago')
  })

  it('testing days', function () {
    expect(formatDateFromNow(nowDate - 86400000, msg)).toEqual('1d ago')
    expect(formatDateFromNow(nowDate - 172800000, msg)).toEqual('2d ago')
  })
  it('testing hours', function () {
    expect(formatDateFromNow(nowDate - 3600000, msg)).toEqual('1h ago')
    expect(formatDateFromNow(nowDate - 7200000, msg)).toEqual('2h ago')
  })
  it('testing minutes', function () {
    expect(formatDateFromNow(nowDate - 60000, msg)).toEqual('1m ago')
    expect(formatDateFromNow(nowDate - 120000, msg)).toEqual('2m ago')
  })
  it('testing seconds', function () {
    expect(formatDateFromNow(nowDate - 10000, msg)).toEqual('10s ago')
    expect(formatDateFromNow(nowDate - 20000, msg)).toEqual('20s ago')
  })
})

describe('test userFormatOfBytes', function () {
  it('B to KiB', function () {
    const b = 1024
    expect(userFormatOfBytes(b))
      .toMatchObject({ str: '1.0 KiB', rounded: '1.0', suffix: 'KiB' })
  })

  it('B to MiB (1.5 MiB)', function () {
    const b = (1024 ** 2) + (500 * 1024)
    expect(userFormatOfBytes(b))
      .toMatchObject({ str: '1.5 MiB', rounded: '1.5', suffix: 'MiB' })
  })

  it('B to MiB (7.6 MiB)', function () {
    const b = (7 * 1024 ** 2) + (600 * 1024)
    expect(userFormatOfBytes(b))
      .toMatchObject({ str: '7.6 MiB', rounded: '7.6', suffix: 'MiB' })
  })

  it('MiB to GiB', function () {
    const b = 1538
    expect(userFormatOfBytes(b, 'MiB'))
      .toMatchObject({ str: '1.5 GiB', rounded: '1.5', suffix: 'GiB' })
  })
})
