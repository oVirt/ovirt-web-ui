/* eslint-env jest */
import Immutable from 'immutable'
import { runSaga } from 'redux-saga'
import { compareVersion, mapConfigKeyVersion } from './utils'

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

const testConfigValues = Immutable.fromJS({
  TestKey1: {
    4.2: false,
    4.3: true,
    4.4: undefined,
    4.5: null,
  },
  TestKey2: {
    4.4: { a: 'apple', b: 'banana', c: 'cherry' },
  },
})

export async function returnSaga (state, saga, ...args) {
  const dispatched = []

  // TODO: `runSaga()` returns a Task object.  In the current redux-saga version, to get
  //       the saga's return value, use `await runSaga(...).done`.  In future versions of
  //       redux-saga, it will need to change to `await runSaga(...).toPromise()`.
  const result = await runSaga(
    {
      dispatch: (action) => dispatched.push(action),
      getState: () => state,
    },
    saga,
    ...args
  ).done

  return { dispatched, result }
}

describe('mapConfigKeyVersion', () => {
  test.each([
    ['TestKey1', '4.2', false],
    ['TestKey1', '4.3', true],
    ['TestKey1', '4.4', undefined],
    ['TestKey1', '4.5', null],
  ])(
    'key/version matched [%s, %s], returns matched value: %p',
    async (key, ver, res) => {
      const { result } = await returnSaga(
        { config: testConfigValues },
        mapConfigKeyVersion,
        key,
        ver,
        null
      )

      expect(result).toBe(res)
    }
  )

  test.each([
    ['TestKey1', '99', null],
    ['TestKey1', '99', 'a'],
    ['TestKey1', '99', 42],
    ['TestKey2', '99', { d: 'dates' }],
    ['TestKey99', '99', null],
  ])(
    'key or version not matched [%s, %s], returns defaultValue: %p',
    async ({ key, ver, def }) => {
      const { result } = await returnSaga(
        { config: testConfigValues },
        mapConfigKeyVersion,
        key,
        ver,
        def
      )

      expect(result).toBe(def)
    }
  )
})
