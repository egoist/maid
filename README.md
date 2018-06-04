# maid

[![NPM version](https://img.shields.io/npm/v/maid.svg?style=flat)](https://npmjs.com/package/maid) [![NPM downloads](https://img.shields.io/npm/dm/maid.svg?style=flat)](https://npmjs.com/package/maid) [![CircleCI](https://circleci.com/gh/egoist/maid/tree/master.svg?style=shield)](https://circleci.com/gh/egoist/maid/tree/master) [![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?maxAge=2592000&style=flat)](https://github.com/egoist/donate) [![chat](https://img.shields.io/badge/chat-on%20discord-7289DA.svg?style=flat)](https://chat.egoist.moe)

> Markdown driven task runner.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
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
    - [py/python](#pypython)
  - [Use a custom maidfile](#use-a-custom-maidfile)
- [Development](#development)
  - [lint](#lint)
  - [test](#test)
  - [toc](#toc)
- [Contributing](#contributing)
- [Author](#author)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

You can install Maid globally:

```bash
# For npm users
npm i -g maid
# For Yarn users
yarn global add maid
```

Or if you want to ensure that your teammates are using the same version as you, it's recommended to install Maid locally:

```bash
# For npm users
npm i -D maid
# For Yarn users
yarn add maid --dev
```

<small>**PRO TIP**: you can use `npx` or `yarn` command to run any locally installed executable that is inside `node_modules/.bin/`, e.g. use `yarn maid` to run the locally installed maid command.</small>

## What is a maidfile?

A maidfile is where you define tasks, in Markdown!

📝 **maidfile.md**:

````markdown
## lint

It uses ESLint to ensure code quality.

```bash
eslint --fix
```

## build

Build our main app

<!-- Following line is a maid command for running task -->

Run task `build:demo` after this

```bash
# note that you can directly call binaries inside node_modules/.bin
# just like how `npm scripts` works
babel src -d lib
```

## build:demo

You can use JavaScript to write to task script too!

```js
const webpack = require('webpack')

// Async task should return a Promise
module.exports = () =>
  new Promise((resolve, reject) => {
    const compiler = webpack(require('./webpack.config'))
    compiler.run((err, stats) => {
      if (err) return reject(err)
      console.log(stats.toString('minimal'))
      resolve()
    })
  })
```
````

Each task is defined using `h2` header and its child contents, the value of `h2` header will be used as task name, its following paragraphs (optional) will be used as task description, and following code block (optional) will be used as task script.

Currently the code block languages are `sh` `bash` `js` `javascript` [and more](#code-block-languages)!.

Now run `maid help` to display the help for this maidfile:

```bash
❯ maid help

  lint        It uses ESLint to ensure code quality.
  build       Build our main app
  build:demo  You can use JavaScript to write to task script too!

❯ maid help "build*"

  build       Build our main app
  build:demo  You can use JavaScript to write to task script too!
```

To run a task, you can directly run `maid <task_name>`

```bash
❯ maid build
[13:46:38] Starting 'build'...
🎉  Successfully compiled 3 files with Babel.
[13:46:38] Finished 'build' after 363 ms...
[13:46:38] Starting 'build:demo'...
webpack compiled in 734ms.
[13:46:38] Finished 'build:demo' after 734 ms...

# to get minimal logs
❯ maid build --quiet
🎉  Successfully compiled 3 files with Babel.
webpack compiled in 734ms.
```

### Run tasks before/after a task

You can run tasks before or after a task:

````markdown
## build

Run task `deploy` after this

```bash
webpack --config config/webpack.config.js
```

## deploy

```bash
gh-pages -d dist
```
````

Expressions that start with `Run(s)? task(s)?` are treated specially. In this case if you run `maid build` it will also run the `deploy` task after `build` has finished.

The syntax is simple: `Runs? tasks? <taskNames> (before|after) this (in parallel)?` where each task name is surrounded by a pair of backticks: <code>`</code>.

By default a task will run before the current task. So `` Run task `build` `` would run `build` before the task it was described in. The presence of `after` anywhere in the sentence (after `Run task`) will cause it to be ran after. Commands run synchronously by default. The presence of `in parallel` in the sentence will cause it to be run in parallel.

Examples:

- `` Run task `build`. ``
- `` Run task `build` after this. ``
- `` Run tasks `clean`, `build`, and `lint`. ``
- `` Run tasks `build:app` `start:server` before this. ``
- `` Run tasks `build:server` `build:client` before this in parallel. ``

### Task hooks

Like npm scripts, when you run a command called `build`, when it's finished we will also run `postbuild` task.

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

````markdown
## log

```bash
echo $1
```
````

Then run `maid log nice` and it will print `nice` in the console.

#### js/javascript

The JS script will also be evaluated.

````markdown
## log

```js
console.log(process.argv)
```
````

##### Asynchronous task

For asynchonous tasks, you can export a function which returns Promise:

````markdown
## build

```js
module.exports = async () => {
  const files = await readFiles('./')
  await buildFiles(files)
}
```
````

#### py/python

````markdown
## log

```py
print("cool")
```
````

### Use a custom maidfile

By default, Maid would use `maidfile.md`, `CONTRIBUTING.md` or `README.md` (case-insensitive) in current working directory, when you're using `README.md` you need to manually specify the section of the markdown you wanna use as Maid tasks like below:

````markdown
## My Project

## How to use

Let me explain..

## Development

<!-- maid-tasks -->

### test

```bash
# some test scripts...
```
````

Unlike a `maidfile.md` which uses all `h2` headers as tasks, in `README.md` only `h3` headers under the specified `h2` header will be used as tasks. You can add a `<!-- maid-tasks -->` comment right below the desired `h2` header.

Alternatively, if you're not using `maidfile.md`, you can also use `--section h2_header` and `--path foo.md` flags to customize it.

## Development

<!-- maid-tasks -->

Maid's own development scripts are powered by itself, run `maid help` or `node bin/cli help` in this project to get more.

### lint

Run ESLint to ensure code quality and code style (via Prettier).

```bash
yarn eslint . "${@:1}"
```

If you want to automatically fix lint errors, try adding `--fix` plugin to the command you run, e.g. `maid lint --fix`

### test

Use [AVA](https://github.com/avajs/ava) to run unit tests.

```bash
yarn ava "${@:1}"
```

Similar to the `lint` task, you can append any flags for `ava` command directly when you run the maid command.

### toc

Generate a **table of contents** section in the README.md file.

```bash
yarn doctoc README.md
```

## Contributing

1.  Fork it!
2.  Create your feature branch: `git checkout -b my-new-feature`
3.  Commit your changes: `git commit -am 'Add some feature'`
4.  Push to the branch: `git push origin my-new-feature`
5.  Submit a pull request :D

## Author

**maid** © [egoist](https://github.com/egoist), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by egoist with help from contributors ([list](https://github.com/egoist/maid/contributors)).

> [github.com/egoist](https://github.com/egoist) · GitHub [@egoist](https://github.com/egoist) · Twitter [@\_egoistlily](https://twitter.com/_egoistlily)
