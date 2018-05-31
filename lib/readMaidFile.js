const fs = require('fs')

const isCommandQuoteRe = /^\s*Run\s+(.+)\s+(after|before)\s+this(\s+in\s+parallel)?\s*/i
const isCommandQuote = v => isCommandQuoteRe.test(v)
const parseCommandQuote = v => {
  const [, commandQuote, when, inParallel] = isCommandQuoteRe.exec(v)
  const taskNames = commandQuote.match(/`([^`]+)`/g).map(v => /`(.+)`/.exec(v)[1])

  return {
    taskNames,
    when,
    inParallel: Boolean(inParallel)
  }
}

module.exports = filepath => {
  if (!fs.existsSync(filepath)) return null

  const content = fs.readFileSync(filepath, 'utf8')
  const md = require('markdown-it')()
  const tokens = md.parse(content)

  const tasks = []

  for (const [index, token] of tokens.entries()) {
    if (token.type === 'heading_open') {
      const task = {
        name: tokens[index + 1].content,
        before: [],
        after: []
      }
      const restTokens = tokens.slice(index + 1)
      for (const [index2, token2] of restTokens.entries()) {
        if (token2.type === 'heading_open') {
          break
        }
        if (token2.type === 'blockquote_open') {
          const { content } = restTokens[index2 + 2]
          task.description = content.split('\n').filter(v => {
            const isCommandQuoteBool = isCommandQuote(v)
            if (isCommandQuoteBool) {
              const { taskNames, when, inParallel } = parseCommandQuote(v)
              task[when].push({
                taskNames,
                inParallel
              })
            }
            return !isCommandQuoteBool
          }).join('\n')
        }
        if (token2.type === 'fence') {
          task.script = token2.content
          task.type = token2.info
        }
      }
      tasks.push(task)
    }
  }

  return {
    tasks
  }
}
