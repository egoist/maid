const chokidar = require('chokidar')
const logger = require('./logger')

class FileWatcher {
  constructor() {
    this.watcher = chokidar.watch('dir', {
      ignored: /(^|[/\\])\../,
      persistent: true
    })
    this.watcher
      .on('add', path => logger.log(`File ${path} has been added`))
      .on('change', path => logger.log(`File ${path} has been changed`))
      .on('unlink', path => logger.log(`File ${path} has been removed`))
      .on('addDir', path => logger.log(`Directory ${path} has been added`))
      .on('unlinkDir', path => logger.log(`Directory ${path} has been removed`))
      .on('error', error => logger.log(`Watcher error: ${error}`))
      .on('ready', () => logger.log('Initial scan complete. Ready for changes'))
  }

  watch(file) {
    this.watcher.add(file)
    console.log(this.watcher.getWatched())
  }

  unwatch(file) {
    this.watcher.unwatch(file)
  }

  close() {
    this.watcher.close()
  }
}

module.exports = FileWatcher
