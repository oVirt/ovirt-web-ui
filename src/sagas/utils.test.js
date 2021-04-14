/* eslint-env jest */

import { compareVersion } from './utils'

describe('compareVersion', () => {
  const cases = [
    {
      title: 'invalid string',
      result: false,
      actual: {
        major: 'qwerty',
        minor: 'qwerty',
        build: 'qwerty',
      },
      required: {
        major: 4,
        minor: 4,
      },
    },
    {
      title: 'missing version',
      result: false,
      actual: {
        major: undefined,
        minor: undefined,
        build: undefined,
      },
      required: {
        major: 4,
        minor: 4,
      },
    },
    {
      title: 'higher on major, lower on minor',
      result: true,
      actual: {
        major: 5,
        minor: 0,
        build: 0,
      },
      required: {
        major: 4,
        minor: 4,
      },
    },
    {
      title: 'equal versions',
      result: true,
      actual: {
        major: 4,
        minor: 4,
        build: 0,
      },
      required: {
        major: 4,
        minor: 4,
      },
    },
    {
      title: 'major too low',
      result: false,
      actual: {
        major: 3,
        minor: 4,
        build: 0,
      },
      required: {
        major: 4,
        minor: 4,
      },
    },
    {
      title: 'minor too low',
      result: false,
      actual: {
        major: 4,
        minor: 3,
        build: 0,
      },
      required: {
        major: 4,
        minor: 4,
      },
    },
  ]
  cases.forEach(({ title, actual, required, result }) => test(title, () => expect(compareVersion(actual, required)).toEqual(result)))
})
