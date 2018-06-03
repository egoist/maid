const path = require('path')
const MarkdownIt = require('markdown-it')
const MaidError = require('./MaidError')

const md = new MarkdownIt({
  // Enable HTML so that we can ignore it later
  html: true
})

const {
  regex,
  whole,
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

const MAID_TASKS_SECTION = whole(['<!--', 'maid-tasks', '-->'].join(space))

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

const isOpenHeader = (token, tag = 'h2') =>
  token.type === 'heading_open' && token.tag === tag

const isCloseHeader = (token, tag = 'h2') =>
  token.type === 'heading_close' && token.tag === tag

const selectSubset = (tokens, firstIndex, tag = 'h2') => {
  const remaining = tokens.slice(firstIndex + 1)

  const next = remaining.findIndex(
    t => t.type === 'heading_open' && t.tag === tag
  )

  return remaining.slice(0, next === -1 ? undefined : next)
}

const isMaidSectionComment = token => {
  return (
    token &&
    token.type === 'html_block' &&
    regex(MAID_TASKS_SECTION).test(token.content.trim())
  )
}

const getSectionByComment = tokens => {
  let section
  for (const [index, token] of tokens.entries()) {
    if (isCloseHeader(token) && isMaidSectionComment(tokens[index + 1])) {
      section = tokens[index - 1].content
      break
    }
  }
  return section
}

module.exports = (content, { section, filepath } = {}) => {
  let tokens = md.parse(content)

  const isMaidfile = !filepath || path.basename(filepath) === 'maidfile.md'

  // Automatically get maid section from non maidfile by `<!-- maid-tasks -->` comment
  if (!section && !isMaidfile) {
    section = getSectionByComment(tokens)

    if (!section) {
      return null
    }
  }

  const taskTag = section ? 'h3' : 'h2'

  const tasks = []

  if (section) {
    const firstIndex = tokens.findIndex(
      (t, i, array) => isOpenHeader(t, 'h2') && array[i + 1].content === section
    )

    if (firstIndex < 0) {
      throw new MaidError(`Unable to find \`h2\` header titled: '${section}'`)
    }

    tokens = selectSubset(tokens, firstIndex, 'h2')
  }

  for (const [index, token] of tokens.entries()) {
    if (isOpenHeader(token, taskTag)) {
      const task = {
        name: tokens[index + 1].content,
        before: [],
        after: [],
        scripts: []
      }

      const sectionTokens = selectSubset(tokens, index, taskTag)

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
          task.scripts = [
            ...task.scripts,
            { src: token.content, type: token.info }
          ]
        }
      }

      tasks.push(task)
    }
  }

  return {
    filepath,
    tasks
  }
}

module.exports.isCommand = isCommand
module.exports.parseCommand = parseCommand
