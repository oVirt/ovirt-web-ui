import { enhanceOutput } from '../../src/logger'
import chalk from 'chalk'

enhanceOutput({
  debug: [ chalk.bold.white.bgHex('#21409a')(' debug ') ],
  info: [ chalk.bold.white.bgHex('#01acac')(' info ') ],
  warn: [ chalk.bold.white.bgHex('#f8a51b')(' warn ') ],
  error: [ chalk.bold.white.bgHex('#ed403c')(' error ') ],
})
