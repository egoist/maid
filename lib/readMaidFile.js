const parseMarkdown = require('./parseMarkdown')
const loadFile = require('./loadFile')

module.exports = section => {
  const { path: filepath, data } = loadFile.loadSync([
    'maidfile.md',
    'contributing.md',
    'CONTRIBUTING.md',
    'README.md',
    'readme.md'
  ])
  if (!filepath) return null

  return parseMarkdown(data, { section, filepath })
}
