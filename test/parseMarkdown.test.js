const test = require('ava')
const parseMarkdown = require('../lib/parseMarkdown')

test('simple', t => {
  const res = parseMarkdown(`
## hey

This script is used to say hey.

> blockquote is unnecessary now and treated just like paragraph.

But it's very complex so I'm writing some instructions.

Run \`goodbye\` after this.

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
