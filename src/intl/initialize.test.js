/* eslint-env jest */
import { coerceToSupportedLocale } from './initialize'

describe('coerce to supported locale', () => {
  test.each([null, '', 'pt', 'pt-PT', 'nv'])(
    'returns null for [%s]',
    locale => {
      expect(coerceToSupportedLocale(locale)).toEqual(null)
    }
  )

  test.each(['pt_BR', 'pt-BR', 'pt_br', 'pt-br'])(
    'returns pt-BR for [%s]',
    locale => {
      expect(coerceToSupportedLocale(locale)).toEqual('pt-BR')
    }
  )

  test.each(['en_US', 'en_us', 'en-US', 'en-us', 'en'])(
    'returns en for [%s]',
    locale => {
      expect(coerceToSupportedLocale(locale)).toEqual('en')
    }
  )

  test.each(['zh_CN', 'zh-CN', 'zh_cn', 'zh-cn'])(
    'returns zh-CN for [%s]',
    locale => {
      expect(coerceToSupportedLocale(locale)).toEqual('zh-CN')
    }
  )
})
