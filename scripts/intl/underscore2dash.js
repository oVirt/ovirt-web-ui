// @flow

import fs from 'fs'
import path from 'path'

import chalk from 'chalk'

const DIRECTORY = path.join('extra', 'from-zanata')

function main() {
  fs.readdirSync(DIRECTORY)
    .map(fileName => ({
      original: fileName,
      match: /^(\w{2,})_(\S{2,}\.po)$/.exec(fileName)
    }))
    .filter(item => item.match !== null)
    .forEach(item => {
      const oldFile = path.join(DIRECTORY, item.original)
      const newFile = path.join(DIRECTORY, `${item.match[1]}-${item.match[2]}`)
      fs.renameSync(oldFile, newFile)
      console.log(chalk.green(`[underscore2dash.js] ${oldFile} -> ${newFile} ✔`))
    })
}

main()
