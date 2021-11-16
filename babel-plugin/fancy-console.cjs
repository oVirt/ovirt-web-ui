
const ENHANCEMENETS_PER_METHOD = {
  log: ['%c debug %c', 'font-weight: bold; background-color: #21409a; color: white;', ''],
  info: ['%c info %c', 'font-weight: bold; background-color: #01acac; color: white;', ''],
  warn: ['%c warn %c', 'font-weight: bold; background-color: #f8a51b; color: white;', ''],
  error: ['%c error %c', 'font-weight: bold; background-color: #ed403c; color: white;', ''],
}

const DEFAULT_LOGGERS = [
  {
    object: 'console',
    methods: Object.keys(ENHANCEMENETS_PER_METHOD),
    enhancements: ENHANCEMENETS_PER_METHOD,
  },
]

module.exports = ({ types: t }) => ({
  visitor: {
    CallExpression (path, state = {}) {
      const { opts: { loggers = DEFAULT_LOGGERS } } = state
      const { node } = path

      const logger = matchEnhancementLogger(path, loggers)
      if (logger && node.arguments.length > 0) {
        const enhancement = logger.enhancements[path.node.callee.property.name]
        const first = node.arguments.shift()

        if (['StringLiteral', 'TemplateLiteral'].includes(first.type)) {
          const newFirst = t.binaryExpression(
            '+',
            t.stringLiteral(enhancement[0]),
            t.binaryExpression('+', t.stringLiteral(' '), first)
          )

          node.arguments.unshift(
            newFirst,
            ...enhancement.slice(1).map(e => t.stringLiteral(e))
          )
        } else {
          node.arguments.unshift(
            ...enhancement.map(e => t.stringLiteral(e)),
            first
          )
        }
      }
    },
  },
})

function matchEnhancementLogger (path, loggers) {
  const { object, property } = path.node.callee

  return loggers.find(logger =>
    logger.object === (object && object.name) &&
    logger.methods.includes(property && property.name)
  )
}
