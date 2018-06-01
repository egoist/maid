const fs = require('fs')

const isCommandRe = /^\s*Run\s+tasks?\s+(.+)\s+(after|before)\s+this(\s+in\s+parallel)?\s*/i
const isCommand = v => isCommandRe.test(v)
const parseCommand = v => {
  const [, command, when, inParallel] = isCommandRe.exec(v)
  const taskNames = command
    .match(/`([^`]+)`/g)
    .map(v => /`(.+)`/.exec(v)[1])

  return {
    taskNames,
    when,
    inParallel: Boolean(inParallel)
  }
}

const extractParagraphs = tokens => {
  const p = []
  for (const [index, token] of tokens.entries()) {
    if (token.type === 'paragraph_open') {
      p.push(tokens[index + 1].content)
    }
  }
  return p
}

module.exports = content => {
  const md = require('markdown-it')({
    // Enable HTML so that we can ignore it later
    html: true
  })
  const tokens = md.parse(content)

  const tasks = []

  for (const [index, token] of tokens.entries()) {
    if (token.type === 'heading_open' && token.tag === 'h2') {
      const task = {
        name: tokens[index + 1].content,
        before: [],
        after: []
      }

      const remaining = tokens.slice(index + 1)
      const nextHeadingIndex = remaining.findIndex(token => {
        return token.type === 'heading_open' && token.tag === 'h2'
      })
      const sectionTokens = remaining.slice(0, nextHeadingIndex || undefined)

      // Get paragraphs from the tokens of this h2 section
      const paragraphs = extractParagraphs(sectionTokens)
      // Set paragraph contents as task description
      // Except for special commands
      task.description = paragraphs.filter(p => {
        const isCommandBool = isCommand(p)
        if (isCommandBool) {
          const { taskNames, when, inParallel } = parseCommand(p)
          task[when].push({
            taskNames,
            inParallel
          })
        }
        return !isCommandBool
      }).join('\n\n')

      // Get task script from the tokens' code fences
      // Currently only use the first one
      for (const token of sectionTokens) {
        if (token.type === 'fence') {
          task.script = token.content
          task.type = token.info
          break
        }
      }

      tasks.push(task)
    }
  }

  return {
    tasks
  }
}
