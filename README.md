# Debounced

### Debounced versions of standard DOM events

This library uses [event delegation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_delegation)
to add debounced versions of standard [*bubbling*](https://developer.mozilla.org/en-US/docs/Web/API/Event/bubbles) DOM events.

<!-- Tocer[start]: Auto-generated, don't remove. -->

## Table of Contents

  - [Why?](#why)
  - [Install](#install)
  - [Basic Usage](#basic-usage)
  - [Advanced Usage](#advanced-usage)
  - [FAQ](#faq)
  - [Releasing](#releasing)

<!-- Tocer[finish]: Auto-generated, don't remove. -->

## Why?

Have you ever wired up event listeners for [`keyup`](https://developer.mozilla.org/en-US/docs/Web/API/Document/keyup_event),
[`input`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event), or
[`mousemove`](https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event)?
If so, you know that these events are dispatched frequently and
often necessitate adding custom debounce functionality to your application.

**What if you could simply listen for a debounced event instead?**
Now you can.

This technique pairs extremely well with libraries like
[Stimulus](https://github.com/stimulusjs/stimulus) and [StimulusReflex](https://github.com/hopsoft/stimulus_reflex).
Here are some simple examples.

```erb
<input type="text" data-controller="example" data-action="debounced:input->example#work">
<input type="text" data-reflex="debounced:input->Example#work">
```

## Install

```sh
yarn add debounced
```

## Basic Usage

```js
import debounced from 'debounced'
debounced.initialize()
```

```js
document.addEventListener('debounced:input', event => { ... })
document.getElementById('example').addEventListener('debounced:keydown', event => { ... })
```

## Advanced Usage

By default we set up debounced events for [all DOM events that bubble](https://github.com/hopsoft/debounced/blob/master/src/events.js),
but you can also specify which events you'd like debounced.

```js
import debounced from 'debounced'

// debounce only the input event and wait 100ms before dispatching
debounced.initialize({ input: { wait: 100 } })
```

You can customize `wait` times for the default events.

```js
import debounced from 'debounced'

// initialize default events but change the wait time for keyup
debounced.initialize({ ...debounced.events, keyup: { wait: 100 } })
```

You can specify when the debounced event should dispatch by indicating whether it should trigger at the
leading and/or trailing edge of the wait timeout.

```js
import debounced from 'debounced'

// initialize default events and change to leading debounce
debounced.initialize({ ...debounced.events, keyup: { leading: true, trailing: false } })
```

> [!NOTE]
> Defaults are `{ wait: 200, leading: false, trailing: true }`

You can also add debounced versions of custom events.

```js
import debounced from 'debounced'

// initialize all default events and add some custom events
debounced.initialize({ ...debounced.events, "custom-event": { wait: 150 } })


// initialize a single custom event
debounced.initializeEvent('another-custom-event', { wait: 150 })
```

You can even change the prefix of the debounced event names.

```js
debounced.initialize({ prefix: 'my-application', ...debounced.events })
document.addEventListener('my-application:input', event => { ... })
```

You can fire the event on the leading edge of the timeout with option `leading` set to `true` (default is `false`).
You can fire the event on the trailing edge of the timeout with option `trailing` set to `true` (default is `true`).

```js
import debounced from 'debounced'

// fire the keyup event as soon as it is receive and debounce the following keyup event(s) during the wait time period.
debounced.initialize({ keyup: { wait: 200, leading: true, trailing: true } })
```

Note: If `leading` and `trailing` options are `true`, the event is fired on the trailing edge of the timeout only if the event occurred more than once during the wait timeout.

## FAQ

- What is the default `wait` time?

  **200ms**

- Can I customize the `wait` time for an event type more than once?

  **No, the setting used to initialize the event is global.**

- Does the debounced event run before or after the standard DOM event?

  **After**

## Releasing

1. Run `npm update` to pick up the latest dependencies
1. Update the version number consistently in the following files:
   * `package.json` - pre-release versions use `-preN`
1. Run `npm run prettier:write`
1. Run `npm run build`
1. Commit and push any changes to GitHub
1. Run `npm publish --access public`
1. Create a new release on GitHub ([here](https://github.com/hopsoft/debounced/releases))
