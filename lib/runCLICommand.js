const path = require('path')
const spawn = require('cross-spawn')
const MaidError = require('./MaidError')

const exec = (cmd, args) =>
  spawn(cmd, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: `${path.resolve('node_modules/.bin')}:${process.env.PATH}`
    }
  })

module.exports = ({ task, type = task.type, resolve, reject }) => {
  const cmd = exec(type, ['-c', task.script, ...process.argv.slice(2)])

  cmd.on('close', code => {
    if (code === 0) {
      resolve()
    } else {
      reject(new MaidError(`task "${task.name}" exited with code ${code}`))
    }
  })

  return cmd
}

module.exports.exec = exec
