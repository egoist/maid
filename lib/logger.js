const log = require('fancy-log')

class Logger {
  constructor() {
    this.opts = {}
  }

  setOptions({ quiet }) {
    if (quiet !== undefined) {
      this.opts.quiet = typeof quiet === 'boolean' ? quiet : false
    }
  }

  log(...args) {
    if (this.opts.quiet) return

    log(...args)
  }

  error(...args) {
    log.error(...args)
  }
}

module.exports = new Logger()
