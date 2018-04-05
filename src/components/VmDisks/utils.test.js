/* eslint-env jest */

import { sortDisksForDisplay } from './utils'
import { fromJS } from 'immutable'

const samples = [
  {
    testTitle: 'bootable, simple name',
    locale: 'en',
    test: fromJS([
      { bootable: false, name: 'Zulu' },
      { bootable: false, name: 'Yankee' },
      { bootable: true, name: 'Xray' },
      { bootable: true, name: 'Alpha' },
      { bootable: false, name: 'Beta' },
    ]),
    expect: fromJS([
      { bootable: true, name: 'Alpha' },
      { bootable: true, name: 'Xray' },
      { bootable: false, name: 'Beta' },
      { bootable: false, name: 'Yankee' },
      { bootable: false, name: 'Zulu' },
    ]),
  },

  {
    testTitle: 'name with number',
    locale: 'en',
    test: fromJS([
      { bootable: false, name: 'Zulu' },
      { bootable: false, name: 'Yankee 7' },
      { bootable: false, name: 'Yankee' },
      { bootable: false, name: 'Xray' },
      { bootable: false, name: 'Alpha 1' },
      { bootable: false, name: 'Alpha 10' },
      { bootable: false, name: 'Alpha 7' },
      { bootable: false, name: 'Beta' },
    ]),
    expect: fromJS([
      { bootable: false, name: 'Alpha 1' },
      { bootable: false, name: 'Alpha 7' },
      { bootable: false, name: 'Alpha 10' },
      { bootable: false, name: 'Beta' },
      { bootable: false, name: 'Xray' },
      { bootable: false, name: 'Yankee' },
      { bootable: false, name: 'Yankee 7' },
      { bootable: false, name: 'Zulu' },
    ]),
  },

  {
    testTitle: 'name with number',
    locale: 'cs',
    test: fromJS([
      { bootable: false, name: 'r' },
      { bootable: false, name: 'ř10' },
      { bootable: false, name: 'ř9' },
      { bootable: false, name: 'ř' },
    ]),
    expect: fromJS([
      { bootable: false, name: 'r' },
      { bootable: false, name: 'ř' },
      { bootable: false, name: 'ř9' },
      { bootable: false, name: 'ř10' },
    ]),
  },
]

describe('disk sorting', () => {
  samples.forEach(sample => {
    test(`${sample.testTitle} [${sample.locale}]`, () => {
      const result = sortDisksForDisplay(sample.test, sample.locale)
      expect(result).toEqual(sample.expect)
    })
  })
})
