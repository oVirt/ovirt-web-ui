/* eslint-env jest */

import { enumMsg } from './index'

describe('intl', () => {
  it('enumMsg should survive unknown enum item', () => {
    const unknownEnumItem = 'unknownEnumItem'
    expect(enumMsg('UnknownEnum', unknownEnumItem)).toEqual(unknownEnumItem)
  })
})
