// Based on https://standardjs.com/
// Inspired by:
//   - https://github.com/standard/eslint-config-standard
//   - https://github.com/airbnb/javascript
//   - https://github.com/facebook/create-react-app/blob/master/packages/eslint-config-react-app
//   - https://github.com/openshift/console/tree/master/frontend/packages/eslint-plugin-console

//
// TODO 2: Adopt `eslint-plugin-jest` and `eslint-plugin-testing-library` for tests with
//         an overrides section entry:
//           https://github.com/facebook/create-react-app/blob/master/packages/eslint-config-react-app/jest.js
//
// TODO 3: Consider alternative or additional extends:
//           eslint-config-airbnb, eslint-config-react-app, eslint-config-prettier
//

module.exports = {
  root: true,

  parser: '@babel/eslint-parser',

  // include the `eslint-config-*` configs, plugins, settings, and rules from:
  //   - https://github.com/standard/eslint-config-standard/blob/master/eslintrc.json
  //   - https://github.com/standard/eslint-config-standard-react/blob/master/eslintrc.json
  extends: [
    'standard',
    'standard-react',
  ],

  plugins: [
    '@babel',
    'flowtype',
    'import',
    'react',
    'react-hooks',
  ],

  env: {
    browser: true,
    commonjs: true,
    es2020: true,
    jest: true,
    node: true,
  },

  parserOptions: {
    // 2015=6, 2016=7, 2017=8, 2018=9, 2019=10, 2020=11, 2021=12
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    babelOptions: {
      configFile: './config/babel.app.config.cjs',
    },
  },

  settings: {
    react: {
      version: 'detect',
    },

    flowtype: {
      onlyFilesWithFlowAnnotation: true,
    },
  },

  overrides: [
    // this is where we can handle different files with different rules (jest, typescript)
    {
      // dummy override to force checking *.cjs files
      files: '**/*.cjs',
      rules: {},
    },
  ],

  // override the rules we inherit from the `extends` modules
  // rule refs:
  //   - https://github.com/standard/eslint-config-standard/blob/master/eslintrc.json
  //   - https://github.com/standard/eslint-config-standard-react/blob/master/eslintrc.json
  //   - https://github.com/facebook/create-react-app/blob/master/packages/eslint-config-react-app/base.js
  //   - https://github.com/facebook/create-react-app/blob/master/packages/eslint-config-react-app/index.js
  rules: {
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
      functions: 'never',
    }],
    'generator-star-spacing': ['error', { before: false, after: true }],
    'no-duplicate-imports': 'error',
    'object-curly-spacing': ['error', 'always'],
    'prefer-object-spread': 'error',

    // be picky about ternary multiline and indents
    'multiline-ternary': ['error', 'always-multiline'],
    // TODO: Consider using https://github.com/getify/eslint-plugin-proper-ternary

    // modified from eslint-config-standard for ternary expressions
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
        VariableDeclarator: 1,
        outerIIFEBody: 1,
        MemberExpression: 1,
        FunctionDeclaration: { parameters: 1, body: 1 },
        FunctionExpression: { parameters: 1, body: 1 },
        CallExpression: { arguments: 1 },
        ArrayExpression: 1,
        ObjectExpression: 1,
        ImportDeclaration: 1,
        ignoreComments: false,
        ignoredNodes: ['TemplateLiteral *', 'JSXElement', 'JSXElement > *', 'JSXAttribute', 'JSXIdentifier', 'JSXNamespacedName', 'JSXMemberExpression', 'JSXSpreadAttribute', 'JSXExpressionContainer', 'JSXOpeningElement', 'JSXClosingElement', 'JSXFragment', 'JSXOpeningFragment', 'JSXClosingFragment', 'JSXText', 'JSXEmptyExpression', 'JSXSpreadChild'],

        flatTernaryExpressions: true,
        offsetTernaryExpressions: false,
      },
    ],

    'import/no-duplicates': 'error',

    // ref: https://github.com/yannickcr/eslint-plugin-react
    // basic react and jsx rules
    'react/no-unsafe': 'warn',
    'react/jsx-uses-vars': 'warn',
    'react/jsx-uses-react': 'warn',
    'react/jsx-fragments': ['warn', 'syntax'],
    'react/jsx-equals-spacing': ['error', 'never'],
    'react/jsx-pascal-case': ['warn', { allowAllCaps: true, ignore: [] }],

    // JSX formatting, indents and multiline rules:
    'react/jsx-closing-tag-location': 'warn',
    'react/jsx-closing-bracket-location': ['warn', 'line-aligned'],
    'react/jsx-indent': ['warn', 2, { checkAttributes: true, indentLogicalExpressions: true }],
    'react/jsx-indent-props': ['warn', 2],
    'react/jsx-wrap-multilines': [
      'warn',
      {
        declaration: 'parens-new-line',
        assignment: 'parens-new-line',
        return: 'parens-new-line',
        arrow: 'parens-new-line',
        condition: 'parens-new-line',
        logical: 'parens-new-line',
        prop: 'parens-new-line',
      },
    ],

    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    'flowtype/boolean-style': ['error', 'boolean'],
    'flowtype/define-flow-type': 'warn',
    'flowtype/delimiter-dangle': ['error', 'never'],
    'flowtype/generic-spacing': ['error', 'never'],
    'flowtype/no-primitive-constructor-types': 'error',
    'flowtype/no-types-missing-file-annotation': 'error',
    'flowtype/no-weak-types': 'off',
    'flowtype/object-type-delimiter': ['error', 'comma'],
    'flowtype/require-parameter-type': ['error', { excludeArrowFunctions: true }],
    'flowtype/require-return-type': ['error', 'always', { excludeArrowFunctions: true, annotateUndefined: 'never' }],
    'flowtype/require-valid-file-annotation': 'error',
    'flowtype/semi': ['error', 'never'],
    'flowtype/space-after-type-colon': ['error', 'always'],
    'flowtype/space-before-generic-bracket': ['error', 'never'],
    'flowtype/space-before-type-colon': ['error', 'never'],
    'flowtype/type-id-match': ['error', '^([A-Z][a-z0-9]+)+Type$'],
    'flowtype/union-intersection-spacing': ['error', 'always'],
    'flowtype/use-flow-type': 'warn',
    'flowtype/valid-syntax': 'warn',

    // TODO: eslint-plugin-node rules for scripts/*?
  },
}
