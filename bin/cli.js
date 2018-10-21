#!/usr/bin/env node
const cli = require('cac')()
const chalk = require('chalk')

cli.command('*', 'Run a task in current working directory', (input, flags) => {
  const taskName = input[0]
  if (!taskName) {
    return cli.showHelp()
  }
  const runner = require('..')(flags)
  return runner.runFile(taskName)
})

cli.command('help', 'Display task description', (input, flags) => {
  const runner = require('..')(flags)
  return runner.getHelp(input)
})

cli.command('list', 'Display task list', (input, flags) => {
  const runner = require('..')(flags)
  return runner.getList()
})

cli.on('error', err => {
  if (err.name === 'MaidError') {
    require('../lib/logger').error(chalk.red(err.message))
    process.exitCode = 1
  } else {
    console.error(err.stack)
  }
})

cli.option('quiet', {
  desc: 'Be less verbose, output error logs only',
  type: 'boolean',
  default: false
})

cli.option('path', {
  desc: 'Path to markdown file',
  type: 'string',
  default: 'maidfile.md',
  alias: 'p'
})

cli.option('section', {
  desc: 'Which `h2` section to look under',
  type: 'string',
  alias: 's'
})

cli.parse()
