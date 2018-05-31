
# maid

[![NPM version](https://img.shields.io/npm/v/maid.svg?style=flat)](https://npmjs.com/package/maid) [![NPM downloads](https://img.shields.io/npm/dm/maid.svg?style=flat)](https://npmjs.com/package/maid) [![CircleCI](https://circleci.com/gh/egoist/maid/tree/master.svg?style=shield)](https://circleci.com/gh/egoist/maid/tree/master)  [![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?maxAge=2592000&style=flat)](https://github.com/egoist/donate) [![chat](https://img.shields.io/badge/chat-on%20discord-7289DA.svg?style=flat)](https://chat.egoist.moe)

> Markdown driven task runner.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Install](#install)
- [What is a maidfile?](#what-is-a-maidfile)
  - [Run tasks before/after a task](#run-tasks-beforeafter-a-task)
  - [Task hooks](#task-hooks)
- [Advanced](#advanced)
  - [Code block languages](#code-block-languages)
    - [bash/sh](#bashsh)
      - [Read command line arguments](#read-command-line-arguments)
    - [js/javascript](#jsjavascript)
      - [Asynchronous task](#asynchronous-task)
- [Contributing](#contributing)
- [Author](#author)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

```bash
npm i -g maid
```

## What is a maidfile?

A maidfile is where you define tasks, in Markdown!

📝 __maidfile.md__:

````markdown
## lint

> Run ESLint to ensure code quality

```bash
eslint --fix
```

## build

> Build our main app
> Run `build:demo` after this

```bash
# note that you can directly call binaries inside node_modules/.bin
# just like how `npm scripts` works
babel src -d lib
```

## build:demo

> Run a custom build script which is written in JS for the demo!

```js
const webpack = require('webpack')

const compiler = webpack(require('./webpack.config'))
compiler.run((err, stats) => {
  console.log(err || stats.toString('minimal'))
})
```
````

Each task is defined as a `heading 2` section, the value of heading 2 will be used as task name, the following blockquote (optional) will be used as task description, the following code block (required) will be used as task script. 

Currently the code block language can be `sh` `bash` `js` `javascript`. 

Now run `maid help` to display the help for this maidfile:

```bash
❯ maid help

  lint        Run ESLint to ensure code quality
  build       Build our main app
  build:demo  Run a custom build script which is written in JS for the demo!

❯ maid help "build*"

  build       Build our main app
  build:demo  Run a custom build script which is written in JS for the demo!
```

To run a task, you can directly run `maid <task_name>`

```bash
❯ maid build
[13:46:38] Starting 'build'...
🎉  Successfully compiled 3 files with Babel.
[13:46:38] Finished 'build' after 363 ms...

# to get minimal logs
❯ maid build --quiet
🎉  Successfully compiled 3 files with Babel.
```

### Run tasks before/after a task

You can even run tasks before or after a task:

````markdown
## build

> Run `deploy` after this

```bash
webpack --config config/webpack.config.js
```

## deploy

```bash
gh-pages -d dist
```
````

Basically blockquotes like <code>Run &#x60;deploy&#x60; after this</code> is treated specially, in this case it says _run the task `deploy` after this task is finished_.

The syntax is simple: `Run <taskNames> (before|after) this (in parallel?)` where each task name is surrounded by a pair of backticks: <code>`</code>.

### Task hooks

Like npm scripts, when you run a command called `build`, when it's finised we will also run `postbuild` task.

Hook syntax: 

- `pre<taskName>`: Run before a specific task.
- `post<taskName>`: Run after a specific task.
- `afterAll`: Run after all tasks.
- `beforeAll`: Run before all tasks.

## Advanced

### Code block languages

#### bash/sh

##### Read command line arguments

The CLI arguments are passed to executed script, so you can access it like this:

````bash
## log

```bash
echo $1
```
````

Then run `maid log nice` and it will print `nice` in the console.

#### js/javascript

The JS script will also be evaluated.

##### Asynchronous task

For task script that is written in JavaScript, you can export a function which returns Promise:

````markdown
## build

```js
module.exports = async () => {
  const files = await readFiles('./')
  await buildFiles(files)
}
```
````

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D


## Author

**maid** © [egoist](https://github.com/egoist), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by egoist with help from contributors ([list](https://github.com/egoist/maid/contributors)).

> [github.com/egoist](https://github.com/egoist) · GitHub [@egoist](https://github.com/egoist) · Twitter [@_egoistlily](https://twitter.com/_egoistlily)
