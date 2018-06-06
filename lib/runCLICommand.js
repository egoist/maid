const path = require('path')
const execa = require('execa')
const MaidError = require('./MaidError')

module.exports = ({ task, type = task.type, resolve, reject }) => {
  const modulesBin = path.resolve(path.join('node_modules', '.bin'))
  const isShell = /(ba|z)?sh/.test(type)
  const isPython = /py(thon)?/.test(type)
  const args = process.argv.slice(2)
  const content = JSON.stringify(task.script)

  let script = null

  if (isShell) {
    script = [task.script, ...args]
  } else if (isPython) {
    script = ['python', '-c', content, ...args]
  } else {
    script = [type, content, ...args]
  }

  const promise = execa.shell(script.join(' '), {
    stdio: 'inherit',
    env: Object.assign({}, process.env, {
      PATH: `${modulesBin}:${process.env.PATH}`
    })
  })

  promise.on('close', code => {
    if (code === 0) {
      resolve()
    } else {
      reject(new MaidError(`task "${task.name}" exited with code ${code}`))
    }
  })

  // we don't need to return
  // 1. because this function is executed in new Promise(() => {})
  // 2. we have its resolve and reject, so it's better to use them
  promise.then(resolve).catch(err => {
    reject(new MaidError(`task "${task.name}" failed with "${err.message}"`))
  })
}
