const path = require('path')
const spawn = require('cross-spawn')
const MaidError = require('./MaidError')

module.exports = ({ task, type = task.type, resolve, reject }) => {
  const cmd = spawn(type, ['-c', task.script, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: Object.assign({}, process.env, {
      PATH: `${path.resolve('node_modules/.bin')}:${process.env.PATH}`
    })
  })

  cmd.on('close', code => {
    if (code === 0) {
      resolve()
    } else {
      reject(new MaidError(`task "${task.name}" exited with code ${code}`))
    }
  })

  return cmd
}
