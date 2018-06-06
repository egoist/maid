const chokidar = require('chokidar')
const logger = require('./logger')

Array.prototype.asyncForEach = async function(callback) { // eslint-disable-line
  for (let index = 0; index < this.length; index++) {
    await callback(this[index], index, this)
  }
}
class FileWatcher {
  constructor() {
    this.runner = []
    this.watcher = []
    this.watchedTasks = {}
  }

  init(runner) {
    this.watcher.push(
      chokidar.watch(['file, dir, glob'], {
        ignored: /(^|[/\\])\../,
        persistent: true,
        ignoreInitial: true
      })
    )

    this.watcher[0]
      .on('add', path =>
        this.getTaskNames(path).asyncForEach(async taskName => {
          await runner.runFile(taskName)
        })
      )
      .on('change', path =>
        this.getTaskNames(path).asyncForEach(async taskName => {
          await runner.runFile(taskName)
        })
      )
      .on('unlink', path =>
        this.getTaskNames(path).asyncForEach(async taskName => {
          await runner.runFile(taskName)
        })
      )
      .on('error', error => logger.log(`Watcher error: ${error}`))
  }

  getTaskNames(path) {
    let foundTask = null
    Object.keys(this.watchedTasks).forEach(taskName => {
      if (this.watchedTasks[taskName] === path) {
        foundTask = taskName
      } else {
        let pathRegex = this.watchedTasks[taskName].replace('*', '(.*?)')
        pathRegex =
          pathRegex.charAt(pathRegex.length - 1) === '/'
            ? pathRegex.concat('(.*?)')
            : pathRegex
        if (new RegExp(pathRegex).test(path)) {
          foundTask = taskName
        }
      }
    })

    return foundTask.split(',')
  }

  watch(file, taskName) {
    this.watcher[0].add(file)
    this.watchedTasks[taskName] = file
  }

  unwatch(file) {
    this.watcher[0].unwatch(file)
  }

  close() {
    this.watcher[0].close()
  }
}

// Singleton
const instance = new FileWatcher()
Object.freeze(instance)

module.exports = instance
