module.exports = class MaidError extends Error {
  constructor(msg) {
    super(msg)
    this.name = 'MaidError'
  }
}
