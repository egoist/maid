const chokidar = require('chokidar')
const logger = require('./logger')

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
      .on('add', path => runner.runFile(this.getTaskName(path)))
      .on('change', path => runner.runFile(this.getTaskName(path)))
      .on('unlink', path => runner.runFile(this.getTaskName(path)))
      .on('error', error => logger.log(`Watcher error: ${error}`))
  }

  getTaskName(path) {
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

    return foundTask
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
