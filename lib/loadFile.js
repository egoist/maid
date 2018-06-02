const path = require('path')
const JoyCon = require('joycon')

module.exports = new JoyCon({
  // Stop reading at parent dir
  // i.e. Only read file from process.cwd()
  stopDir: path.dirname(process.cwd())
})
