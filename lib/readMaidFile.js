const fs = require('fs')
const parseMarkdown = require('./parseMarkdown')
const find = require('find-file-up')

// a bit duplication with what we have in parseMarkdown.js, but we can't DRY it
const MAIDFILE = 'maidfile.md'

/**
 * Resolving mechanism. Always starts to search for `maidfile.md` from
 * the current working directory to 5 levels upwards (probably enough).
 * Then repeats this for `.maidfile.md` (with dot) but 10 levels upwards,
 * because who knows, someone may have big folder trees.
 *
 * Second step. If it can't find the Maid files (above ones) and there is
 * no given `--config-path / -c` flag on the CLI it throws with error message
 * thrown from the main Maid class constructor.
 *
 * Third step. If config path is given, it treats that config file
 * a bit more specifically, as described in the (current) readme - task names should be
 * h3 headers and should have some h2 header, which in turn can also be defined on
 * the CLI through the `--section` flag.
 *
 * @param {Object} opts command line global flags
 * @returns {Object} like `{ filepath, tasks }`, coming from parseMarkdown
 */
module.exports = (opts = {}) => {
  let filepath =
    find.sync(MAIDFILE, opts.cwd, 5) || find.sync(`.${MAIDFILE}`, opts.cwd, 10)

  // in case when it cannot resolve `maidfile.md` or `.maidfile.md`
  // files anywhere upwards, and there is no other file given
  // through `--maidfile` flag, then inform that you don't have config file
  // or it is invalid eg. `[03:39:50] No config file was found. Stop.`
  if (!filepath && opts.maidfile === MAIDFILE) return null

  // otherwise resolve the given file from `--config-path` flag
  if (opts.maidfile !== MAIDFILE && opts.maidfile !== `.${MAIDFILE}`) {
    filepath = opts.maidfile
  }

  const content = fs.readFileSync(filepath, 'utf8')

  return parseMarkdown(content, { section: opts.section, filepath })
}
