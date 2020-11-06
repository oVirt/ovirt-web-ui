// Inspired by https://github.com/airbnb/javascript but less opinionated.

// We use eslint-loader so even warnings are very visibile.
// This is why we only use "WARNING" level for potential errors,
// and we don't use "ERROR" level at all.

// In the future, we might create a separate list of rules for production.
// It would probably be more strict.

module.exports = {
  root: true,

  parser: 'babel-eslint',

  extends: ['standard', 'standard-react'],

  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    node: true,
  },

  plugins: [
    'flowtype',
    'import',
    'react-hooks',
  ],

  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      generators: true,
      experimentalObjectRestSpread: true,
    },
  },

  settings: {
    'import/ignore': [
      'node_modules',
      '\\.(json|css|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$',
    ],
    'import/extensions': ['.js'],
    'import/resolver': {
      node: {
        extensions: ['.js', '.json'],
      },
    },
    'flowtype': {
      'onlyFilesWithFlowAnnotation': true
    }
  },

  rules: {
    'no-duplicate-imports': 2,
    'comma-dangle': [2, 'always-multiline'],
    'object-curly-spacing': [2, 'always'],
    'import/no-duplicates': 2,
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'flowtype/boolean-style': [
      2,
      'boolean'
    ],
    'flowtype/define-flow-type': 1,
    'flowtype/delimiter-dangle': [
      2,
      'never'
    ],
    'flowtype/generic-spacing': [
      2,
      'never'
    ],
    'flowtype/no-primitive-constructor-types': 2,
    'flowtype/no-types-missing-file-annotation': 2,
    'flowtype/no-weak-types': 0,
    'flowtype/object-type-delimiter': [
      2,
      'comma'
    ],
    'flowtype/require-parameter-type': [2, {
      'excludeArrowFunctions': true
    }],
    'flowtype/require-return-type': [
      2,
      'always',
      {
        'excludeArrowFunctions': true,
        'annotateUndefined': 'never'
      }
    ],
    'flowtype/require-valid-file-annotation': 2,
    'flowtype/semi': [
      2,
      'never'
    ],
    'flowtype/space-after-type-colon': [
      2,
      'always'
    ],
    'flowtype/space-before-generic-bracket': [
      2,
      'never'
    ],
    'flowtype/space-before-type-colon': [
      2,
      'never'
    ],
    'flowtype/type-id-match': [
      2,
      '^([A-Z][a-z0-9]+)+Type$'
    ],
    'flowtype/union-intersection-spacing': [
      2,
      'always'
    ],
    'flowtype/use-flow-type': 1,
    'flowtype/valid-syntax': 1,
    'generator-star-spacing': [2, {"before": false, "after": true}],
  },
}
