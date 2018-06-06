const loadFile = require('./loadFile')
const MaidError = require('./MaidError')
const fs = require('fs')
const path = require('path')
const { exec } = require('./runCLICommand')
const logger = require('./logger')

const flattenObj = (a, b) => ({
  ...a,
  ...b
})

const getPassThroughArgs = flags => {
  const passThroughArgs = []

  if (flags.quiet) {
    passThroughArgs.push('--quiet')
  }

  if (flags.section) {
    passThroughArgs.push('-s', flags.section)
  }

  const pathIndex = process.argv.findIndex(arg => arg.match(/-p|--path/)) + 1
  if (pathIndex) {
    passThroughArgs.push('-p', process.argv[pathIndex])
  }

  return passThroughArgs.join(' ')
}

const checkForTaskConflicts = (maidTasks, customScripts) => {
  const conflictingTasks = maidTasks.filter(task =>
    Object.keys(customScripts).includes(task)
  )

  if (conflictingTasks.length) {
    throw new MaidError(
      `Conflicts between maidfile and package.json. Please check these scripts: \n\t
        ${conflictingTasks.join(', ')}`
    )
  }
}

module.exports = (maid, flags) => {
  const { path: pkgPath, data: pkg } = loadFile.loadSync(['package.json'])
  if (!pkgPath) return null

  const maidExec =
    path.basename(process.argv[0]) === 'node'
      ? `node ${path.relative(process.cwd(), process.argv[1])}`
      : 'maid'

  const { scripts = {} } = pkg
  const tasks = maid
    .listTasks()
    .filter(
      (task, index, tasks) =>
        !tasks.includes((task.match(/(?:pre|post)(.*)/) || [])[1])
    )
  const passThroughArgs = getPassThroughArgs(flags)

  const baseScripts = Object.keys(scripts)
    .filter(task => !scripts[task].startsWith(maidExec))
    .map(task => ({ [task]: scripts[task] }))
    .reduce(flattenObj, {})

  checkForTaskConflicts(tasks, baseScripts)

  const finalScripts = tasks
    .map(task => ({
      [task]: `${maidExec} ${passThroughArgs} ${task}`.replace(/\s+/g, ' ')
    }))
    .reduce(flattenObj, baseScripts)

  if (flags.write) {
    fs.writeFileSync(
      pkgPath,
      JSON.stringify({ ...pkg, ...{ scripts: finalScripts } }, null, 2)
    )
  } else {
    logger.log('\n', finalScripts)
  }

  if (flags.gitAdd) {
    exec('git', ['add', pkgPath])
  }
}
