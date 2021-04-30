import { formatHowLongAgo } from '_/utils/format'

describe('testing formating from now date', function () {
  const nowDate = Date.now()
  it('testing years', function () {
    expect(formatHowLongAgo(nowDate - 31536000000, nowDate)).toEqual('a year ago')
    expect(formatHowLongAgo(nowDate - 63072000000, nowDate)).toEqual('2 years ago')
  })

  it('testing months', function () {
    expect(formatHowLongAgo(nowDate - 30536000000, nowDate)).toEqual('a year ago')
    expect(formatHowLongAgo(nowDate - 15768000000, nowDate)).toEqual('6 months ago')
  })

  it('testing days', function () {
    expect(formatHowLongAgo(nowDate - 86400000, nowDate)).toEqual('a day ago')
    expect(formatHowLongAgo(nowDate - 172800000, nowDate)).toEqual('2 days ago')
  })
  it('testing hours', function () {
    expect(formatHowLongAgo(nowDate - 3600000, nowDate)).toEqual('an hour ago')
    expect(formatHowLongAgo(nowDate - 7200000, nowDate)).toEqual('2 hours ago')
  })
  it('testing minutes', function () {
    expect(formatHowLongAgo(nowDate - 45000, nowDate)).toEqual('a minute ago')
    expect(formatHowLongAgo(nowDate - 60000, nowDate)).toEqual('a minute ago')
    expect(formatHowLongAgo(nowDate - 120000, nowDate)).toEqual('2 minutes ago')
  })
  it('testing seconds', function () {
    expect(formatHowLongAgo(nowDate, nowDate)).toEqual('a few seconds ago')
    expect(formatHowLongAgo(nowDate - 10000, nowDate)).toEqual('a few seconds ago')
    expect(formatHowLongAgo(nowDate - 44000, nowDate)).toEqual('a few seconds ago')
  })
})
