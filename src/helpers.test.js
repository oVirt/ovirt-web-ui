/* eslint-env jest */
import { userFormatOfBytes } from '_/helpers'

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
