const fs = require('fs')
const parseMarkdown = require('./parseMarkdown')

module.exports = (filepath, section) => {
  if (!fs.existsSync(filepath)) return null

  const content = fs.readFileSync(filepath, 'utf8')
  return parseMarkdown(content, section)
}
