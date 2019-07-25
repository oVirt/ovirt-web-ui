// @flow

import PropTypes from 'prop-types'

/**
 * Validate the property by verifying the _xorPropName_ existence matches this prop's
 * existence and then that the prop meets the _baseValidator_'s tests.
 *
 * Use this to ensure that both properties must be present or missing.
 */
const xor =
  (baseValidator: PropTypes.Validator, xorPropName: string) =>
    (props: Object, propName: string, componentName: string, ...rest: Array<any>): Error | null => {
      if ((props[propName] && !props[xorPropName]) || (!props[propName] && props[xorPropName])) {
        return new Error(`Props '${propName}' and '${xorPropName}' are both required for component '${componentName}'`)
      }

      return baseValidator(props, propName, componentName, ...rest)
    }

export {
  xor,
}
