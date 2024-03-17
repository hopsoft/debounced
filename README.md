[![Lines of Code](https://img.shields.io/badge/loc-134-47d299.svg)](http://blog.codinghorror.com/the-best-code-is-no-code-at-all/)

# Debounced

### Debounced versions of native DOM events

This library uses [event delegation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_delegation)
to add debounced versions of native _(and custom)_ [*bubbling*](https://developer.mozilla.org/en-US/docs/Web/API/Event/bubbles) DOM events.

<!-- Tocer[start]: Auto-generated, don't remove. -->

## Table of Contents

  - [Why?](#why)
  - [Install](#install)
  - [Quick Start](#quick-start)
  - [Usage](#usage)
    - [Leading / Trailing](#leading--trailing)
    - [Custom Events](#custom-events)
    - [Unregistering Events](#unregistering-events)
    - [Debounced Prefix](#debounced-prefix)
  - [API](#api)
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

## Quick Start

Invoking `initialize` without arguments will register debounced events for [all native DOM events that bubble](https://github.com/hopsoft/debounced/blob/master/src/events.js).

```js
import debounced from 'debounced'

// initialize without args to register all native DOM events that bubble
debounced.initialize()
```

You can also initialize with a custom list of events.

```js
// initialize with a custom list of events
debounced.initialize(['click', 'input', 'keydown'])
```

```js
// listen for debounced events
document.addEventListener('debounced:input', event => { ... })
document.getElementById('example').addEventListener('debounced:keydown', event => { ... })
document.querySelectorAll('a').forEach(a => a.addEventListener('debounced:click', event => { ... }))
```

## Usage

Initialize with custom options.

```js
debounced.initialize(debounced.defaultEventNames, { wait: 500, leading: true, trailing: false })
```

You can register additional events at any time.

```js
// register more events after initialization
debounced.register(['change', 'mousedown'])
```

You can customize options for registered events by re-registering with different options.

```js
// re-register events and to change options
debounced.register(debounced.registeredEventNames, { wait: 100 })
```

### Leading / Trailing

You can specify when debounced events fire via the `leading` and `trailing` options.

- `leading` - fires after the source event but before waiting
- `trailing` - fires after the source event and after waiting

Leading and trailing events will only fire once per source event.

> [!NOTE]
> If both `leading` and `trailing` are `true`, a debounced event will trigger before and after the timeout.

### Custom Events

You can add debounced versions of custom events.

```js
// register an individual custom event
debounced.registerEvent('custom-event', { ... })

// register a list of custom events
debounced.register(['custom-event-one', 'custom-event-two'], { wait: 150 })
```

### Unregistering Events

You can unregiser events at any time.

```js
// unregister a single event
debounded.unregisterEvent('keyup')

// unregister a list of events
debounced.unregister(['click', 'input', 'keydown'])
```

### Debounced Prefix

You can change the prefix of the debounced event names.

```js
debounced.prefix = 'custom-prefix'
debounced.initialize()
document.addEventListener('custom-prefix:click', event => { ... })
```

## API

| Name                   | Description                                     |
|------------------------|-------------------------------------------------|-
| `defaultEventNames`    | List of native DOM events that bubble           |
| `defaultOptions`       | Default options applied when registering events |
| `initialize`           | Intializes and registers debounced events       |
| `prefix`               | Prefix used for debounced event names (get/set) |
| `registerEvent`        | Registers a single event for debouncing         |
| `register`             | Registers a list of events for debouncing       |
| `registeredEventNames` | List of all registered event names              |
| `registeredEvents`     | All registered events with their options        |
| `unregisterEvent`      | Unregisters a single event                      |
| `unregister`           | Unregisters a list of events                    |

The source is small and well documented. [Learn more about the API here.](#todo)

## FAQ

**Q:** What are the default native events that bubble?

**A:** [View the list here](#todo) and learn more about these events at [MDN](https://developer.mozilla.org/en-US/docs/Web/Events).

---

**Q:** Can I register an event more than once?

**A:** **Yes**, event re-registration overwrites any existing registrations.

---

**Q:** Do I have to specify all options when registering an event?

**A:** **No**, any omitted options will apply the defaults.

---

**Q:** Are importmaps supported?

**A:** **Yes**, this library is compatible with importmaps.

## Releasing

1. Run `npm update` to pick up the latest dependencies
1. Update the version number consistently in the following files:
   * `package.json` - pre-release versions use `-preN`
1. Run `npm run standardize`
1. Run `npm run build`
1. Commit and push any changes to GitHub
1. Run `npm publish --access public`
1. Create a new release on GitHub ([here](https://github.com/hopsoft/debounced/releases))
