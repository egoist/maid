const test = require('ava')
const parseMarkdown = require('../lib/parseMarkdown')

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
