const vm = require('vm')

/**
 * Example
 *
 * ```js
 * runJavaScript(`var bar = 123; if (bar) console.log(bar + 5)`)
 *   .then(() => {
 *     console.log('done')
 *   })
 *   .catch(console.error)
 * ```
 */

const runJavaScript = (content, filepath) => {
  const run = vm.runInNewContext(
    `(() => new Promise((____resolve) => {
    ____resolve(${content});
}))`,
    {
      global: global,
      process: process,
      require: require,
      console: console,
      exports: exports,
      module: module
    },
    filepath
  )

  return run()
}

// Example
//
// runJavaScript(
//   `module.exports = async () => process.env.NODE_ENV`,
//   'lib/loadFile.js'
// )
//   .then(fn => {
//     console.log('done', fn())
//   })
//   .catch(console.error)

module.exports = runJavaScript
