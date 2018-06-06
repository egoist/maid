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
  capture,
  and,
  or,
  matchers: { ANY, WHITE_SPACE: SPACE, START, LAZY },
  flags
} = require('rexrex')

const space = extra(SPACE)
const isCommandReTemplate = and(
  START, // ^
  wildcard(SPACE),
  [
    'Runs' + LAZY,
    'tasks' + LAZY,
    capture(extra(ANY)),
    capture(or('after', 'before')),
    'this'
  ].join(space),
  capture(
    or(
      and(space, 'and', space, 'watch', space, capture(extra(ANY))),
      and(space, 'in', space, 'parallel')
    )
  ) + LAZY,
  capture(and(space, 'and', space, 'watch', space, capture(extra(ANY)))) + LAZY,
  wildcard(SPACE)
)

const isParallelGroup = regexGroupString =>
  /in\s+parallel/i.test(regexGroupString)
const isWatchGroup = regexGroupString =>
  /(.*?)and watch(.*?)/.test(regexGroupString)
const MAID_TASKS_SECTION = whole(['<!--', 'maid-tasks', '-->'].join(space))

const isCommandRe = new RegExp(isCommandReTemplate, flags.INSENSITIVE)
const commandsRe = new RegExp(/`([^`]+)`/g)

// add default before this' if no 'when' is given to match default regexGroups
const fixCommand = v =>
  isCommandRe.test(v) && commandsRe.test(v)
    ? v
    : v
        .split('and watch')[0]
        .trim()
        .replace(/.+(`(.+?)`)$/, s => `${s} before this`) +
      (v.split('and watch')[1] ? ' and watch' + v.split('and watch')[1] : '')

const isCommand = v => isCommandRe.test(v) && commandsRe.test(v)

const parseCommand = v => {
  const when = v.match(/before|after/i)[0]
  // filter out undefined regex groups
  const regexGroups = isCommandRe
    .exec(v)
    .filter(regGroup => typeof regGroup !== undefined && regGroup !== undefined)

  const [, , , parallelOrWatch] = regexGroups

  const taskNames = regexGroups[1].split(',').map(v => /`(.+)`/.exec(v)[1])
  let inParallel = false, // eslint-disable-line one-var
    watchTargets = null

  // check if third regex group is 'in parallel' or 'and watch'
  if (isParallelGroup(parallelOrWatch)) {
    // in case it's parallel, also check for 'and watch'
    inParallel = true
    // if the forelast group is 'and watch',
    // set the watchTargets to the last regex group
    watchTargets =
      isWatchGroup(regexGroups[regexGroups.length - 2]) &&
      regexGroups[regexGroups.length - 1].includes('`')
        ? regexGroups[regexGroups.length - 1].replace(/`/g, '')
        : null
  } else if (isWatchGroup(parallelOrWatch)) {
    watchTargets = regexGroups[regexGroups.length - 1].replace(/`/g, '')
  }

  return {
    taskNames,
    when,
    inParallel: inParallel,
    watchTargets
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
        after: []
      }

      const sectionTokens = selectSubset(tokens, index, taskTag)

      // Get paragraphs from the tokens of this h2 section
      const paragraphs = extractParagraphs(sectionTokens)
      // Set paragraph contents as task description
      // Except for special commands
      task.description = paragraphs
        .filter(p => {
          p = fixCommand(p)
          const isCommandBool = isCommand(p)
          if (isCommandBool) {
            const { taskNames, when, inParallel, watchTargets } = parseCommand(
              p
            )
            task[when].push({
              taskNames,
              inParallel,
              watchTargets
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
  return {
    filepath,
    tasks
  }
}

module.exports.isCommand = isCommand
module.exports.parseCommand = parseCommand
