const test = require('ava')
const parseMarkdown = require('../lib/parseMarkdown')
const { isCommand, parseCommand, fixCommand } = parseMarkdown

test('isCmd', t => {
  t.false(isCommand('Run task'))
  t.true(isCommand(fixCommand('Run task `blah`')))
  t.is(isCommand(fixCommand('run Task `blah`')), false)
  t.is(isCommand(fixCommand('Runs task `blah`')), true)
  t.is(isCommand(fixCommand('Run tasks `blah` and `blah`')), true)
  t.is(isCommand(fixCommand('Runs tasks `blah` and `blah`')), true)
  t.is(isCommand(fixCommand('Run tasks `blah` and `blah` in parallel')), false)
  t.is(isCommand(fixCommand('Run task `blah` after this in parallel')), false)
})

test('simple', t => {
  const res = parseMarkdown(`
## hey

This script is used to say hey.

> blockquote is unnecessary now and treated just like paragraph.

But it's very complex so I'm writing some instructions.

Run task \`goodbye\` after this.

\`\`\`js
console.log('key')
\`\`\`

## goodbye

hehehe

\`\`\`sh
echo goodbye
\`\`\`

  `)

  t.snapshot(res)
})

test('parseCommand', t => {
  t.deepEqual(parseCommand(fixCommand('run task `foo`')), {
    taskNames: ['foo'],
    when: 'before',
    watchTargets: null,
    inParallel: false
  })

  t.deepEqual(
    parseCommand('Runs task `foo` in parallel after this task has completed'),
    {
      taskNames: ['foo'],
      when: 'after',
      watchTargets: null,
      inParallel: true
    }
  )

  t.deepEqual(parseCommand(fixCommand('run task `foo` in parallel')), {
    taskNames: ['foo'],
    when: 'before',
    watchTargets: null,
    inParallel: true
  })

  t.deepEqual(parseCommand(fixCommand('run tasks `foo`, `bleh`, and `blu`')), {
    taskNames: ['foo', 'bleh', 'blu'],
    when: 'before',
    watchTargets: null,
    inParallel: false
  })

  t.deepEqual(
    parseCommand(
      'run tasks `foo`, `bleh`, and `blu` after this and watch `lib/`'
    ),
    {
      taskNames: ['foo', 'bleh', 'blu'],
      when: 'after',
      watchTargets: 'lib/',
      inParallel: false
    }
  )

  t.deepEqual(
    parseCommand(
      'run tasks `foo`, `bleh`, and `blu` after this in parallel and watch `src/*.js`, `*.json`'
    ),
    {
      taskNames: ['foo', 'bleh', 'blu'],
      when: 'after',
      watchTargets: ['src/*.js', '*.json'],
      inParallel: true
    }
  )
})

test('selected section', t => {
  const section = `
## hey

This script is used to say hey.

### key

\`\`\`js
console.log('key')
\`\`\`

### goodbye

hehehe

\`\`\`sh
echo goodbye
\`\`\`
`

  const res = parseMarkdown(section, { section: 'hey' })

  t.snapshot(res)
})

test('use readme', t => {
  const res = parseMarkdown(
    `
# my project

cool

## usage

lorem

## build scripts

<!-- maid-tasks -->

### dev

some dev script

## license

MIT
  `,
    { filepath: 'README.md' }
  )

  t.snapshot(res)
})
