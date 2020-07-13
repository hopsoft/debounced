# [WIP] Debounced

**NOTE: This project is in alpha and is subject to change.**

This library uses [event delegation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_delegation)
to globally add debounced versions of standard *high frequency* DOM events.
This means you can simply listen for the debounced event instead of adding custom debounce logic.

Only works on *high frequency* events that [bubble](https://developer.mozilla.org/en-US/docs/Web/API/Event/bubbles).

## Examples

```js
document.addEventListener('debounced:input', event => { /* only dispatched once */ })

document.getElementById('example')
  .addEventListener('debounced:keydown', event => { /* only dispatched once */ })
```
