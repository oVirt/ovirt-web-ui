const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const paths = require('../../config/paths');

function checkRequiredFiles() {
  const filesPathToCheck = [paths.appHtml, paths.appIndexJs];
  filesPathToCheck.forEach(filePath => {
    try {
      fs.accessSync(filePath, fs.F_OK);
    } catch (err) {
      const dirName = path.dirname(filePath);
      const fileName = path.basename(filePath);
      console.log(chalk.red('Could not find a required file.'));
      console.log(chalk.red('  Name: ') + chalk.cyan(fileName));
      console.log(chalk.red('  Searched in: ') + chalk.cyan(dirName));
      process.exit(1);
    }
  });
}

module.exports = checkRequiredFiles;
