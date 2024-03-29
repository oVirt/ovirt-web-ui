// Grab NODE_ENV and REACT_APP_* environment variables and prepare them to be
// injected into the application via DefinePlugin in Webpack configuration.

const REACT_APP = /^REACT_APP_/i
const NODE_ENV = JSON.stringify(process.env.NODE_ENV || 'development')

export default Object
  .keys(process.env)
  .filter(key => REACT_APP.test(key))
  .reduce((env, key) => {
    env['process.env.' + key] = JSON.stringify(process.env[key])
    return env
  }, {
    'process.env.NODE_ENV': NODE_ENV,
    'window.DEVELOPMENT': JSON.stringify(process.env.NODE_ENV === 'development'),
  })
