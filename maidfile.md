## lint

It uses ESLint to check source files

```bash
eslint . "${@:1}"
```

## test

Run task `lint` before this

```bash
ava
```

## cool

Just say cool

```js
console.log('cool')
```

## say-what-you-input

```bash
echo $1
```

## toc

```bash
doctoc README.md
```
