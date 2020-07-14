# Debounced

### Debounced versions of standard DOM events

This library uses [event delegation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_delegation)
to add debounced versions of standard [*bubbling*](https://developer.mozilla.org/en-US/docs/Web/API/Event/bubbles) DOM events.

## Why?

Have you ever wired up event listeners for keyup, input, or mousemove?
If so, you know that these events are dispatched frequently and
often necessitate adding custom debounce functionality to your application.

**What if you could simply listen for a debounced event instead?**
Well... now you can.

Also, this technique pairs extremely well with libraries like
[Stimulus](https://github.com/stimulusjs/stimulus) and [StimulusReflex](https://github.com/hopsoft/stimulus_reflex).

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

By default **debounced** sets up debounced events for all DOM events that bubble,
but you can also specify which events you'd like debounced.

```js
import debounced from 'debounced'
debounced.initialize({input: { wait: 100 }}) // debounce only the input event and wait 100ms before dispatching
document.addEventListener('debounced:input', event => { ... })
```

You can customize the wait time of a single event.

```js
import debounced from 'debounced'
debounced.initialize({...debounced.events, keyup: { wait: 100 }})
```

You can also debounce custom events.

```js
import debounced from 'debounced'
debounced.initialize()
debounced.initializeEvent('my-custom-event', { wait: 150 })
```

## FAQ

- What is the default `wait` time?

  **200ms**

- Can I customize the `wait` time for an event type more than once?

  **No, the setting used to initialize the event is global.**

- Does the debounced event run before or after the standard DOM event?

  **After**
