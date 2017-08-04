// @flow

import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import stableStringify from 'json-stable-stringify'

const SOURCE = path.join('extra', 'from-zanata', 'translated-messages.json')
const DESTINATION = path.join('src', 'intl', 'translated-messages.json')

function main() {
  const stringContent = fs.readFileSync(SOURCE, { encoding: 'utf8' })
  const parsedContent = JSON.parse(stringContent)
  const serializedContent = stableStringify(parsedContent, { space: 2 }) + '\n'
  fs.writeFileSync(DESTINATION, serializedContent)
  console.log(chalk.green(`[normalize-messages.js] ${DESTINATION} written ✔`))
}

main()
