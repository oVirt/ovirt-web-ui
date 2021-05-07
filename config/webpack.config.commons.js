var paths = require('./paths')

exports.commonAliases = function () {
  return {
    '_': `${paths.appSrc}`
  }
}
