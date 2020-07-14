# Debounced

### Debounced versions of standard DOM events

## Why

Have you ever wired up event listeners to the keyup, input, or mousemove events.
If so, you know that these events are dispatched frequently and
often necessitate adding debounce functionality in your application code.
**What if you could simply listen for a debounced event instead?**

Well... now you can, and the technique pairs extremely well with libraries like
[Stimulus](https://github.com/stimulusjs/stimulus) and [StimulusReflex](https://github.com/hopsoft/stimulus_reflex).

```erb
<%= text_field_tag :example, data: { controller: "example", action: "debounced:input->example#work" } %>
<%= text_field_tag :example, data: { reflex: "debounced:input->Example#work" } %>
```

## How

This library uses [event delegation](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_delegation)
to add debounced versions of standard [*bubbling*](https://developer.mozilla.org/en-US/docs/Web/API/Event/bubbles) DOM events.

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

You can also debounce custom events.

```js
import debounced from 'debounced'
debounced.initialize()
debounced.initializeEvent('my-custom-event', { wait: 150 })
```
