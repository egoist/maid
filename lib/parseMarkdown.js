const MarkdownIt = require('markdown-it')
const {
  wildcard,
  extra,
  and,
  matchers: { WHITE_SPACE: SPACE, START, LAZY },
  flags
} = require('rexrex')

const space = extra(SPACE)
const isCommandReTemplate = and(
  START, // ^
  wildcard(SPACE),
  ['Runs' + LAZY, 'tasks' + LAZY].join(space)
)

const isCommandRe = new RegExp(isCommandReTemplate, flags.INSENSITIVE)
const commandsRe = new RegExp(/`([^`]+)`/g)
const isCommand = v =>
  Boolean(v.match(isCommandRe)) && Boolean(v.match(commandsRe))
const parseCommand = v => {
  const inParallel = Boolean(v.match(/in\s+parallel/i))
  const when = (v.match(/before|after/i) || ['before'])[0]
  const taskNames = v.match(commandsRe).map(v => /`(.+)`/.exec(v)[1])

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
  const md = new MarkdownIt({
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

      const sectionTokens = remaining.slice(
        0,
        nextHeadingIndex === -1 ? undefined : nextHeadingIndex
      )

      // Get paragraphs from the tokens of this h2 section
      const paragraphs = extractParagraphs(sectionTokens)
      // Set paragraph contents as task description
      // Except for special commands
      task.description = paragraphs
        .filter(p => {
          const isCommandBool = isCommand(p)
          if (isCommandBool) {
            const { taskNames, when, inParallel } = parseCommand(p)
            task[when].push({
              taskNames,
              inParallel
            })
          }
          return !isCommandBool
        })
        .join('\n\n')

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
  // console.log(tasks)
  return {
    tasks
  }
}

module.exports.isCommand = isCommand
module.exports.parseCommand = parseCommand
