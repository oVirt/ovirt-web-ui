//
// Add polyfills to support javascript features we want to use but are not supported
// natively by browsers the app supports and are not handled by babel transform
//

//
// TODO: If the current browserslist browsers all natively support fetch, this can be dropped
// core-js does not polyfill fetch(), so use whatwg-fetch.
//
import 'whatwg-fetch'

//
// NOTE: core-js polyfills are injected in sources by @babel/preset-env { useBuiltIns: 'usage' }
//       as needed based on package.json#browserslist and use detection
//
