/* eslint-env jest */
import { coerceToSupportedLocale } from './initialize'

describe('coerce to supported locale', () => {
  test.each([null, '', 'nv', '', 'pa-IN'])(
    'returns null for [%s]',
    locale => {
      expect(coerceToSupportedLocale(locale)).toEqual(null)
    }
  )

  test.each(['pt_BR', 'pt-BR', 'pt_br', 'pt-br', 'pt', 'pt-PT'])(
    'returns pt-BR for [%s]',
    locale => {
      expect(coerceToSupportedLocale(locale)).toEqual('pt-BR')
    }
  )

  test.each(['fr-FR', 'fr-BE','fr-CA', 'fr-LU', 'fr-CH'])(
    'returns fr-FR for [%s]',
    locale => {
      expect(coerceToSupportedLocale(locale)).toEqual('fr-FR')
    }
  )

  test.each(['en_US', 'en_us', 'en-US', 'en-us', 'en'])(
    'returns en-US for [%s]',
    locale => {
      expect(coerceToSupportedLocale(locale)).toEqual('en-US')
    }
  )

  test.each(['zh_CN', 'zh-CN', 'zh_cn', 'zh-cn'])(
    'returns zh-CN for [%s]',
    locale => {
      expect(coerceToSupportedLocale(locale)).toEqual('zh-CN')
    }
  )
})
