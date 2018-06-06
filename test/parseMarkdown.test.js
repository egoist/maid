const test = require('ava')
const parseMarkdown = require('../lib/parseMarkdown')
const { isCommand, parseCommand } = parseMarkdown

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
  t.deepEqual(parseCommand('run task `blah`'), {
    taskNames: ['blah'],
    when: 'before',
    inParallel: false
  })

  t.deepEqual(
    parseCommand('Runs task `blah` in parallel after this task has completed'),
    {
      taskNames: ['blah'],
      when: 'after',
      inParallel: true
    }
  )

  t.deepEqual(parseCommand('run task `blah` in parallel'), {
    taskNames: ['blah'],
    when: 'before',
    inParallel: true
  })

  t.deepEqual(parseCommand('run tasks `blah`, `bleh`, and `blu`'), {
    taskNames: ['blah', 'bleh', 'blu'],
    when: 'before',
    inParallel: false
  })

  t.deepEqual(
    parseCommand('run tasks `blah`, `bleh`, and `blu` after this in parallel'),
    {
      taskNames: ['blah', 'bleh', 'blu'],
      when: 'after',
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

test('isCommand', t => {
  t.false(isCommand('Run task'))
  t.true(isCommand('Run task `blah`'))
  t.true(isCommand('run Task `blah`'))
  t.true(isCommand('Runs task `blah`'))
  t.true(isCommand('Run tasks `blah` and `blah`'))
  t.true(isCommand('Runs tasks `blah` and `blah`'))
  t.true(isCommand('Run tasks `blah` and `blah` in parallel'))
  t.true(isCommand('Run task `blah` after this in parallel'))
})
