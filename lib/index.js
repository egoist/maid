const path = require('path')
const chalk = require('chalk')
const mm = require('micromatch')
const requireFromString = require('require-from-string')
const logger = require('./logger')
const readMaidFile = require('./readMaidFile')
const MaidError = require('./MaidError')
const runCLICommand = require('./runCLICommand')

class Maid {
  constructor(opts = {}) {
    this.maidfile = readMaidFile(opts.section)
    logger.setOptions({ quiet: opts.quiet })

    if (!this.maidfile) {
      throw new MaidError('No maidfile was found. Stop.')
    }
  }

  async runTasks(taskNames, inParallel) {
    if (!taskNames || taskNames.length === 0) return

    if (inParallel) {
      await Promise.all(
        taskNames.map(taskName => {
          return this.runTask(taskName)
        })
      )
    } else {
      for (const taskName of taskNames) {
        await this.runTask(taskName)
      }
    }
  }

  async runFile(taskName) {
    await this.runTask('beforeAll', false)
    await this.runTask(taskName)
    await this.runTask('afterAll', false)
  }

  async runTask(taskName, throwWhenNoMatchedTask = true) {
    const task =
      taskName &&
      this.maidfile &&
      this.maidfile.tasks.find(task => task.name === taskName)

    if (!task) {
      if (throwWhenNoMatchedTask) {
        throw new MaidError(`No task called "${taskName}" was found. Stop.`)
      } else {
        return
      }
    }

    await this.runTaskHooks(task, 'before')

    const start = Date.now()

    logger.log(`Starting '${chalk.cyan(task.name)}'...`)

    for (const script of task.scripts) {
      await this.runScript(script, task)
    }

    logger.log(
      `Finished '${chalk.cyan(task.name)}' ${chalk.magenta(
        `after ${Date.now() - start} ms`
      )}...`
    )
    await this.runTaskHooks(task, 'after')
  }

  runScript(script, task) {
    return new Promise((resolve, reject) => {
      const handleError = err => {
        throw new MaidError(`Task '${task.name}' failed.\n${err.stack}`)
      }
      if (checkTypes(script, ['sh', 'bash'])) {
        return runCLICommand({ script, task, resolve, reject })
      }
      if (checkTypes(script, ['py', 'python'])) {
        return runCLICommand({ type: 'python', script, task, resolve, reject })
      }
      if (checkTypes(script, ['js', 'javascript'])) {
        let res
        try {
          res = requireFromString(script.src, this.maidfile.filepath)
        } catch (err) {
          return handleError(err)
        }
        res = res.default || res
        return resolve(
          typeof res === 'function'
            ? Promise.resolve(res()).catch(handleError)
            : res
        )
      }

      return resolve()
    })
  }

  async runTaskHooks(task, when) {
    const prefix = when === 'before' ? 'pre' : 'post'
    const tasks = this.maidfile.tasks.filter(({ name }) => {
      return name === `${prefix}${task.name}`
    })
    await this.runTasks(tasks.map(task => task.name))
    for (const item of task[when]) {
      const { taskNames, inParallel } = item
      await this.runTasks(taskNames, inParallel)
    }
  }

  getHelp(patterns) {
    patterns = [].concat(patterns)
    const tasks =
      patterns.length > 0
        ? this.maidfile.tasks.filter(task => {
            return mm.some(task.name, patterns)
          })
        : this.maidfile.tasks

    if (tasks.length === 0) {
      throw new MaidError(
        `No tasks for pattern "${patterns.join(' ')}" was found. Stop.`
      )
    }

    console.log(
      `\n  ${chalk.magenta.bold(
        `Task${tasks.length > 1 ? 's' : ''} in ${path.relative(
          process.cwd(),
          this.maidfile.filepath
        )}:`
      )}\n\n` +
        tasks
          .map(
            task =>
              `  ${chalk.bold(task.name)}\n${chalk.dim(
                task.description
                  ? task.description
                      .split('\n')
                      .map(v => `      ${v.trim()}`)
                      .join('\n')
                  : '      No description'
              )}`
          )
          .join('\n\n') +
        '\n'
    )
  }

  getList() {
    const tasks = this.maidfile.tasks
    console.log(tasks.map(task => task.name).join('\n'))
  }
}

function checkTypes(task, types) {
  return types.some(type => type === task.type)
}

module.exports = opts => new Maid(opts)
