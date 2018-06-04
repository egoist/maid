const loadFile = require('./loadFile')
const MaidError = require('./MaidError')
const fs = require('fs')
const path = require('path')

const flattenObj = (a, b) => ({
  ...a,
  ...b
})

module.exports = maid => {
  const { path: pkgPath, data: pkg } = loadFile.loadSync(['package.json'])
  if (!pkgPath) return null

  const maidExec = process.argv[1].endsWith('.js')
    ? `node ${path.relative(process.cwd(), process.argv[1])}`
    : 'maid'

  const { scripts = {} } = pkg
  const tasks = maid.listTasks()

  const passThroughArgs = process.argv
    .slice(2)
    .filter(arg => arg !== '--update-scripts')
    .join(' ')

  const baseScripts = Object.keys(scripts)
    .filter(task => !scripts[task].startsWith(maidExec))
    .map(task => ({ [task]: scripts[task] }))
    .reduce(flattenObj, {})

  const conflictingTasks = tasks.filter(task =>
    Object.keys(baseScripts).includes(task)
  )

  if (conflictingTasks.length) {
    throw new MaidError(
      `Conflicts between maidfile and package.json. Please check these scripts: \n\t
        ${conflictingTasks.join(', ')}`
    )
  }

  const finalScripts = tasks
    .map(task => ({
      [task]: `${maidExec} ${passThroughArgs} ${task}`.replace(/\s+/g, ' ')
    }))
    .reduce(flattenObj, baseScripts)

  fs.writeFileSync(
    pkgPath,
    JSON.stringify({ ...pkg, ...{ scripts: finalScripts } }, null, 2)
  )
}
