<!-- begin title -->

# `@dimensiondev/browser/prefer-keyboard-event-key`

Prefer KeyboardEvent#key

<!-- end title -->

## Rule Details

### :x: Incorrect

```ts
window.addEventListener('keydown', (event) => {
  if (event.keyCode === 8) {
    console.log('Backspace was pressed')
  }
})
```

### :white_check_mark: Correct

```ts
window.addEventListener('keydown', (event) => {
  if (event.key === 'Backspace') {
    console.log('Backspace was pressed')
  }
})
```

## When Not To Use It

## Attributes

<!-- begin attributes -->

- [x] :white_check_mark: Recommended
- [x] :wrench: Fixable
- [ ] :bulb: Suggestions
- [ ] :gear: Configurable
- [x] :thought_balloon: Requires type information

<!-- end attributes -->

## Thanks

- <https://github.com/sindresorhus/eslint-plugin-unicorn>