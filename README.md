[![Lines of Code](https://img.shields.io/badge/loc-1634-47d299.svg)](http://blog.codinghorror.com/the-best-code-is-no-code-at-all/)

# Debounced

### Debounced versions of standard DOM events

This library uses [event delegation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_delegation)
to add debounced versions of standard [*bubbling*](https://developer.mozilla.org/en-US/docs/Web/API/Event/bubbles) DOM events.

<!-- Tocer[start]: Auto-generated, don't remove. -->

## Table of Contents

  - [Why?](#why)
  - [Install](#install)
  - [Basic Usage](#basic-usage)
  - [Public API](#public-api)
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
[Stimulus](https://github.com/stimulusjs/stimulus), [TurboBoost Commands](https://github.com/hopsoft/turbo_boost-commands), and [StimulusReflex](https://github.com/hopsoft/stimulus_reflex).
Here are some examples.

```erb
<input type="text" data-controller="example" data-action="debounced:input->example#work">
<input type="text" data-reflex="debounced:input->Example#work">
```

## Install

```sh
npm install debounced
```

## Basic Usage

Invoking `initialize` without arguments will register debounced events for [all native DOM events that bubble](https://github.com/hopsoft/debounced/blob/master/src/events.js),

```js
import debounced from 'debounced'

// simply initialize to register all native DOM events that bubble
debounced.initialize()
```

You can also initialize with a custom list of events.

```
// initialize with a custom list of events
debounced.initialize(['click', 'input', 'keydown'])
```

```js
// listen for debounced events
document.addEventListener('debounced:input', event => { ... })
document.getElementById('example').addEventListener('debounced:keydown', event => { ... })
document.querySelectorAll('a').forEach(a => a.addEventListener('debounced:click', event => { ... }))
```

## Public API

- `defaultEventNames` - list of native DOM events that bubble _(list used by `initialize` when called without args)_
- `defaultOptions` - default options applied when registering events
- `initialize` - intializes and registers debounced events _(alias for `registerEvents`)_
- `prefix` - prefix used for debounced event names _(get/set)_
- `registerEvent` - registers a single event for debouncing
- `register` - registers a list of events for debouncing _(aliased as `initialize`)_
- `registeredEventNames` - list of all registered event names
- `registeredEvents` - all registered events with their options
- `unregisterEvent` - unregisters a single event
- `unregister` - unregisters a list of events

## Advanced Usage

You can register additional events at any time.

```js
debounced.initialize(['click', 'input', 'keydown'])

// register more events
debounced.register(['change', 'mousedown'])
```

You can customize options like `wait`, for already registered events.

```js
// re-register events and change the wait time
debounced.register(debounced.registeredEventNames, { wait: 100 })
```

You can also customize individual events.

```js
// re-register the keyup event and change its wait time
debounced.registerEvent('keyup', { wait: 100 })
```

You can specify when the debounced event should trigger via the `leading` and/or `trailing` options.

- `leading` - fires after the source event but before waiting
- `trailing` - fires after the source event and after waiting

The `leading` and `trailing` debounced event will only fire once per source event.

> [!NOTE]
> If both `leading` and `trailing` are `true`, a debounced event will trigger before and after the timeout.

```js
// initialize all default events, but change to use leading debounce
debounced.initialize(debounced.defaultEventNames, { leading: true, trailing: false })

// - or -

// register a single event with a leading debounce
debounced.registerEvent('click', { leading: true, trailing: false })
```

You can also add debounced versions of custom events.

```js
// register a list of custom events
debounced.register(['custom-event-one', 'custom-event-two'], { wait: 150 })

// register an individual custom event
debounced.registerEvent('custom-event', { ... })
```

You can unregiser events at any time.

```js
debounced.unregister(['click', 'input', 'keydown'])
debounded.unregisterEvent('keyup')
```

You can even change the prefix of the debounced event names.

```js
debounced.prefix = 'custom-prefix'
debounced.initialize()
document.addEventListener('custom-prefix:click', event => { ... })
```

## FAQ

- Q: What are all the default native events that bubble?
  A: [View the list here](#todo) and learn more about these events at [MDN](https://developer.mozilla.org/en-US/docs/Web/Events).

- Q: Can I register an event more than once?
  A: **Yes**, new event registrations will overwrite existing ones.

- Q: Do I have to specify all options wen registering an event?
  A: **No**, any omitted options will apply the defaults.

- Q: What are the defaults when for register an event?
  A: `{ wait: 200, leading: false, trailing: true }`

- Q: Are importmaps supported?
  A: **Yes**, this library is compatible with importmaps.

## Releasing

1. Run `npm update` to pick up the latest dependencies
1. Update the version number consistently in the following files:
   * `package.json` - pre-release versions use `-preN`
1. Run `npm run standardize`
1. Run `npm run build`
1. Commit and push any changes to GitHub
1. Run `npm publish --access public`
1. Create a new release on GitHub ([here](https://github.com/hopsoft/debounced/releases))
