[![CI](https://github.com/hopsoft/debounced/actions/workflows/test.yml/badge.svg)](https://github.com/hopsoft/debounced/actions/workflows/test.yml)
[![Lines of Code](https://img.shields.io/badge/loc-235-47d299.svg)](http://blog.codinghorror.com/the-best-code-is-no-code-at-all/)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/865251d9cf564a01b263762f4a2bf71a)](https://app.codacy.com/gh/hopsoft/debounced/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![NPM Version](https://img.shields.io/npm/v/debounced?color=168AFE&logo=npm)](https://www.npmjs.com/package/debounced)
[![NPM Downloads](https://img.shields.io/npm/d18m/debounced.svg?color=168AFE&logo=npm)](https://www.npmjs.com/package/debounced)
[![NPM Bundle Size](https://img.shields.io/bundlephobia/minzip/debounced?label=bundle%20size&logo=npm&color=47d299)](https://bundlephobia.com/package/debounced)

# Debounced

**Universal debounce that works with every framework. Just add the `debounced:` prefix to any event.**

One line of setup gives you debounced events everywhere - from vanilla JavaScript to React, Vue, Alpine, HTMX, Stimulus, ...

```javascript
// Initialize once in your app
import debounced from 'debounced'
debounced.initialize()
// That's it, you're done
```

Now every framework can use debounced events with their native syntax:

```html
<!-- Alpine.js -->
<input @debounced:input="search = $event.target.value" x-model="search" />

<!-- Vue -->
<input @debounced:input="handleSearch" v-model="searchQuery" />

<!-- React (with ref) -->
<input ref="{el" ="" /> el?.addEventListener('debounced:input', handleSearch)} />

<!-- HTMX -->
<input hx-trigger="debounced:input" hx-get="/search" hx-target="#results" />

<!-- Vanilla JS -->
<input oninput="this.dispatchEvent(new Event('debounced:input'))" />
```

Without this library, each framework requires different debounce implementations, incompatible syntaxes, and custom code. With Debounced, they all work the same way.

## The Problem

High-frequency events can fire hundreds of times per second, causing performance issues when attached to expensive operations like API calls or DOM updates. Every framework handles this differently - or not at all.

```html
<!-- Framework-specific debounce syntax is inconsistent -->
<input @input.debounce.500ms="search" /><!-- Alpine.js -->
<input hx-trigger="input delay:300ms" hx-get="/search" /><!-- HTMX -->
<input wire:model.live.debounce.500ms="search" /><!-- Livewire -->
<!-- Stimulus: Requires stimulus-use or custom solution for debounce -->
```

### The Solution

Debounced provides universal `debounced:` events that work identically across all frameworks:

```html
<!-- Same event name works everywhere: 'debounced:input' -->

<!--    ┌── Alpine ───┐ -->
<input @debounced:input="search" />

<!--              ┌──── HTMX ────┐ -->
<input hx-trigger="debounced:input" hx-get="/search" />

<!--    ┌─ Livewire ──┐ -->
<input @debounced:input="$wire.set('search', $event.target.value)" />

<!--                ┌─ Stimulus ──┐ -->
<input data-action="debounced:input->search#query" />
```

**Key Features:**

- ✅ **Universal compatibility** - Works with any JavaScript framework or vanilla JS
- ✅ **True DOM events** - Standard CustomEvents, no wrappers or adapters
- ✅ **110 events supported** - All native DOM events including window events
- ✅ **Zero dependencies** - Pure JavaScript, 6KB minified
- ✅ **Event delegation** - Automatically works with dynamic elements
- ✅ **Per-element timers** - Each element maintains independent debounce state
- ✅ **Leading & trailing** - Fire at start, end, or both (most frameworks only support trailing)

## Table of Contents

<!-- toc -->

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [How It Works](#how-it-works)
- [Basic Usage](#basic-usage)
- [Window Events](#window-events)
- [Event Timing](#event-timing)
- [Event Management](#event-management)
- [Leading vs Trailing](#leading-vs-trailing)
- [Custom Events](#custom-events)
- [Performance Optimization](#performance-optimization)
- [Library Integration](#library-integration)
- [API Reference](#api-reference)
- [Browser Support](#browser-support)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Contributing](#contributing)

<!-- tocstop -->

## Quick Start

```bash
npm install debounced
```

```javascript
// Initialize once in your app
import debounced from 'debounced'
debounced.initialize()
```

Now use debounced events anywhere:

```javascript
// Vanilla JavaScript
document.addEventListener('debounced:input', e => {
  console.log('User stopped typing:', e.target.value)
})
```

```html
<!-- Works with any framework -->
<input @debounced:input="search($event)" />
<!-- Alpine/Vue -->
<input hx-trigger="debounced:input" hx-get="/search" />
<!-- HTMX -->
<input data-action="debounced:input->search#query" />
<!-- Stimulus -->
```

### Real-World Examples

```html
<!-- 🔍 Search with live results -->
<input hx-get="/search" hx-trigger="debounced:input" hx-target="#results" placeholder="Search products..." />

<!-- 📝 Auto-save form -->
<textarea @debounced:input="autoSave($event.target.value)" placeholder="Your content auto-saves as you type"></textarea>

<!-- 🛡️ Prevent double-submit -->
<button @debounced:click="submitOrder" :disabled="submitting">Place Order</button>

<!-- 📜 Infinite scroll -->
<div data-action="debounced:scroll->infinite#loadMore">
  <!-- Content loads automatically as user scrolls -->
</div>
```

**JavaScript when needed:**

```javascript
// Advanced use cases requiring event details
document.addEventListener('debounced:keydown', event => {
  const {key, ctrlKey, metaKey} = event.detail.sourceEvent
  if (key === 's' && (ctrlKey || metaKey)) {
    event.preventDefault()
    saveDocument()
  }
})
```

## Prerequisites

This library requires:

- **JavaScript Knowledge**: Basic understanding of event listeners and ES6+ syntax
- **Browser Support**: Modern browsers with `CustomEvent` support (Chrome 51+, Firefox 54+, Safari 10+)
- **Module System**: ES modules or a bundler like webpack/vite

## Installation

### NPM/Yarn

```bash
npm install debounced
# or
yarn add debounced
```

### CDN with Import Maps

```html
<script type="importmap">
  {
    "imports": {
      "debounced": "https://unpkg.com/debounced/dist/debounced.js"
    }
  }
</script>

<script type="module">
  import debounced from 'debounced'
  debounced.initialize()
</script>
```

## How It Works

### The Problem

High-frequency events can fire hundreds of times per second:

- `input` events fire on every keystroke
- `scroll` events fire continuously during scrolling
- `mousemove` events fire on every pixel of movement

Attaching expensive operations (API calls, DOM updates) to these events causes performance issues.

### The Solution

This library creates debounced versions of events that fire only after user interaction stops:

```javascript
// ❌ Without debouncing: Fires on EVERY keystroke
input.addEventListener('input', event => {
  fetch('/search?q=' + event.target.value) // Hundreds of API calls!
})

// ✅ With debouncing: Fires ONCE after typing stops
input.addEventListener('debounced:input', event => {
  fetch('/search?q=' + event.target.value) // Single API call!
})
```

### Key Benefits

- **Memory Efficient**: Uses event delegation with a single listener per event type
- **Per-Element Timers**: Each element maintains its own independent debounce timer
- **Dynamic Elements**: Automatically works with elements added after initialization
- **Zero Dependencies**: No external libraries required

## Basic Usage

### Initialize Events

```javascript
import debounced from 'debounced'

// Option 1: Initialize all 86 delegatable events (easiest)
debounced.initialize()

// Option 2: Initialize only specific events (most efficient)
debounced.initialize(['input', 'click', 'resize'])

// Option 3: Initialize with custom timing
debounced.initialize(['input'], {wait: 300})
```

### Listen for Debounced Events

All debounced events follow the pattern `debounced:eventname`:

```javascript
// Original event:    'input'
// Debounced event:   'debounced:input'

element.addEventListener('debounced:input', handler)
element.addEventListener('debounced:click', handler)
element.addEventListener('debounced:scroll', handler)
```

### Access Event Data

Debounced events are CustomEvents with this structure:

```javascript
document.addEventListener('debounced:input', event => {
  // event is a CustomEvent with:
  // - target: The element that triggered the event (same as original)
  // - detail: Object containing sourceEvent and type

  // Access element properties directly via event.target
  console.log(event.target.value) // Input value
  console.log(event.target.checked) // Checkbox state
  console.log(event.target.id) // Element ID

  // Access the original event via detail.sourceEvent
  const originalEvent = event.detail.sourceEvent
  console.log(originalEvent.key) // 'Enter', 'a', etc.
  console.log(originalEvent.shiftKey) // Was shift pressed?
  console.log(originalEvent.timeStamp) // When did original fire?
  console.log(originalEvent.constructor.name) // 'InputEvent', 'MouseEvent', etc.

  // Check debounce timing
  const timing = event.detail.type // 'leading' or 'trailing'
})
```

#### When to Use Each Property

| Need to access...   | Use                                  | Example                      |
| ------------------- | ------------------------------------ | ---------------------------- |
| Input value         | `event.target.value`                 | Text field content           |
| Checkbox state      | `event.target.checked`               | Checkbox checked             |
| Element attributes  | `event.target.*`                     | `id`, `className`, `dataset` |
| Keyboard key        | `event.detail.sourceEvent.key`       | Which key was pressed        |
| Mouse position      | `event.detail.sourceEvent.clientX`   | Mouse coordinates            |
| Modifier keys       | `event.detail.sourceEvent.*Key`      | `shiftKey`, `ctrlKey`        |
| Original event type | `event.detail.sourceEvent.type`      | 'input', 'click', etc.       |
| Original timestamp  | `event.detail.sourceEvent.timeStamp` | When event originally fired  |

## Window Events

Debounced supports 110 total events, including 32 window-specific events that don't participate in normal DOM bubbling. These events are critical for performance optimization and app lifecycle management.

### Performance Events

```javascript
window.addEventListener('debounced:resize', updateLayout) // Responsive design
window.addEventListener('debounced:scroll', updateParallax) // Smooth scrolling
window.addEventListener('debounced:orientationchange', reflow) // Mobile rotation
```

### App State Events

```javascript
window.addEventListener('debounced:online', syncData) // Connection restored
window.addEventListener('debounced:offline', showOfflineBanner) // Connection lost
window.addEventListener('debounced:storage', syncCrossTabs) // Cross-tab sync
window.addEventListener('debounced:visibilitychange', pause) // Tab switching
```

### Device Events

```javascript
window.addEventListener('debounced:devicemotion', updateUI) // Accelerometer
window.addEventListener('debounced:deviceorientation', adjust) // Device tilt
```

### Performance Impact

| Event Type         | Without Debouncing                   | With Debouncing             |
| ------------------ | ------------------------------------ | --------------------------- |
| `resize`           | Fires 100+ times during drag         | Fires once when complete    |
| `storage`          | Spams on rapid localStorage changes  | Batches updates efficiently |
| `devicemotion`     | Drains battery with constant updates | Optimizes for performance   |
| `online`/`offline` | Multiple rapid-fire notifications    | Single clean state change   |

## Event Timing

### Customize Wait Time

Control how long to wait before firing the debounced event:

```javascript
// Default: 200ms
debounced.initialize()

// Custom timing for different use cases
debounced.register(['input'], {wait: 300}) // Search: wait longer
debounced.register(['scroll'], {wait: 50}) // Scroll: more responsive
debounced.register(['mousemove'], {wait: 16}) // Animation: 60fps
```

### Timing Recommendations

| Use Case          | Wait Time  | Reason                           |
| ----------------- | ---------- | -------------------------------- |
| Search input      | 300-500ms  | Allows natural typing pauses     |
| Form validation   | 1000ms     | Validates after field completion |
| Scroll tracking   | 50-100ms   | Smooth but not excessive         |
| Window resize     | 150-300ms  | Accounts for drag resizing       |
| Mouse tracking    | 16ms       | 60fps for smooth animations      |
| Button protection | 500-1000ms | Prevents double-clicks           |

## Event Management

### Add Events After Initialization

```javascript
// Add new events anytime
debounced.register(['focus', 'blur'], {wait: 100})

// Register individual event
debounced.registerEvent('customEvent', {wait: 250})

// Mix with existing events - doesn't affect others
debounced.register(['resize'], {wait: 150}) // Other events unchanged
```

### Modify Existing Registrations

Re-registering an event completely replaces its configuration:

```javascript
// Initial registration
debounced.register(['input'], {wait: 200, trailing: true})

// Change wait time
debounced.register(['input'], {wait: 500}) // New wait, defaults for other options

// Change to leading mode
debounced.register(['input'], {wait: 300, leading: true, trailing: false})

// Modify multiple events at once
debounced.register(['input', 'scroll'], {wait: 100, leading: true})
```

**Important:** Re-registration replaces the entire configuration. Any unspecified options return to defaults.

### Remove Events

```javascript
// Unregister specific events
debounced.unregister(['input', 'scroll'])

// Unregister single event
debounced.unregisterEvent('mousemove')

// Unregister everything
debounced.unregister(debounced.registeredEventNames)
```

### Check Registration Status

```javascript
// See what's registered
console.log(debounced.registeredEventNames)
// ['input', 'scroll', 'click']

// Get detailed registration info
console.log(debounced.registeredEvents)
// { input: { wait: 300, leading: false, trailing: true, handler: fn } }
```

## Leading vs Trailing

### Understanding Timing Modes

Debounced events can fire at two points:

- **Leading**: Immediately when interaction starts
- **Trailing**: After the wait period when interaction stops

```javascript
// Default: Trailing only (fires after user stops)
debounced.register(['input'], {
  wait: 300,
  leading: false,
  trailing: true, // Default
})

// Leading only (fires immediately, ignores subsequent)
debounced.register(['click'], {
  wait: 1000,
  leading: true,
  trailing: false,
})

// Both (fires immediately AND after stopping)
debounced.register(['scroll'], {
  wait: 100,
  leading: true,
  trailing: true,
})
```

### When to Use Each Mode

| Mode                        | Use Case                            | Example                                   |
| --------------------------- | ----------------------------------- | ----------------------------------------- |
| **Trailing only** (default) | Wait for user to finish             | Search suggestions, form validation       |
| **Leading only**            | Immediate response, prevent repeats | Button click protection, analytics events |
| **Both**                    | Instant feedback + final state      | Scroll position, drag operations          |

## Custom Events

### Debounce Your Own Events

```javascript
// Register custom event for debouncing
debounced.registerEvent('myCustomEvent', {wait: 200})

// Dispatch your custom event (must bubble!)
const customEvent = new CustomEvent('myCustomEvent', {
  bubbles: true, // Required for event delegation
  detail: {someData: 'value'},
})
element.dispatchEvent(customEvent)

// Listen for debounced version
document.addEventListener('debounced:myCustomEvent', handler)
```

### Custom Event Prefix

Change the prefix for all debounced events:

```javascript
// Must set before initialization
debounced.prefix = 'throttled'
debounced.initialize()

// Now events use your custom prefix
document.addEventListener('throttled:input', handler)
document.addEventListener('throttled:scroll', handler)
```

## Performance Optimization

### Best Practices

```javascript
// ✅ GOOD: Register only what you need
debounced.initialize(['input', 'click', 'resize'])

// ❌ AVOID: Registering everything if you only need a few
debounced.initialize() // Registers all 86 events unnecessarily

// ✅ GOOD: Appropriate timing for each use case
debounced.register(['input'], {wait: 300}) // User typing
debounced.register(['mousemove'], {wait: 50}) // Smooth tracking
debounced.register(['resize'], {wait: 200}) // Window resizing
```

### Performance Impact

**Before debouncing** (search input firing 300 times):

```
API Calls: 300 requests
Network: 450KB transferred
Response Time: 2.3s average
CPU Usage: High (constant processing)
```

**After debouncing** (same interaction, 300ms wait):

```
API Calls: 1 request
Network: 1.5KB transferred
Response Time: 0.2s
CPU Usage: Minimal
```

**Memory Efficiency:**

- **Single Listener**: One document-level listener per event type
- **Automatic Cleanup**: Timers cleared after firing
- **Dynamic Elements**: No manual attach/detach needed
- **Scales Well**: Performance constant regardless of element count

## Library Integration

**The beauty of debounced: it works with every library because it uses native DOM events.** No special integrations needed - if your code can handle `click` events, it can handle `debounced:click` events.

### Supported Events

Debounced supports **110 unique events**:

- **86 document events** - Standard DOM events that bubble (click, input, keydown, etc.)
- **24 window-only events** - Events exclusive to window (storage, online, offline, devicemotion, etc.)
- **8 events work on both** - Window and document (resize, scroll, load, etc.)

### Framework Comparison

| Framework     | Built-in Debounce                                   | What Debounced Adds                                                              |
| ------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Alpine.js** | `@input.debounce.500ms`<br/>Input/model events only | ✅ All 110 events<br/>✅ Leading + trailing timing<br/>✅ Window events          |
| **HTMX**      | `hx-trigger="delay:300ms"`<br/>Server requests only | ✅ Works with local JS<br/>✅ Beyond HTMX requests<br/>✅ True debounce behavior |
| **Livewire**  | `wire:model.debounce.500ms`<br/>Model binding only  | ✅ All event types<br/>✅ Client-side only<br/>✅ Leading + trailing             |
| **LiveView**  | `phx-debounce="300"`<br/>Server events only         | ✅ Client-side handling<br/>✅ Non-phx events<br/>✅ Stable timers               |
| **React**     | No built-in support                                 | ✅ Declarative events<br/>✅ No wrapper functions<br/>✅ Works with refs         |
| **Vue**       | No built-in support                                 | ✅ Template-friendly<br/>✅ Consistent syntax<br/>✅ All event types             |
| **Stimulus**  | Requires stimulus-use                               | ✅ Zero dependencies<br/>✅ 110 native events<br/>✅ Per-element timers          |

### Vanilla JavaScript

No library needed - just use native event listeners:

```javascript
// Add listener
document.addEventListener('debounced:input', event => {
  console.log('Value:', event.target.value)
})

// Or on specific elements
const input = document.querySelector('#search')
input.addEventListener('debounced:input', handleSearch)
```

### Popular JavaScript Libraries

#### React

```jsx
// Note: React doesn't support custom events with onXxx props,
// so you need to use refs and addEventListener

// Reusable hook for debounced events
function useDebounced(ref, eventName, handler, deps = []) {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    const eventType = `debounced:${eventName}`
    element.addEventListener(eventType, handler)
    return () => element.removeEventListener(eventType, handler)
  }, [ref, eventName, handler, ...deps])
}

// Real-world usage example
function ProductSearch() {
  const inputRef = useRef()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  const searchProducts = useCallback(async e => {
    const query = e.target.value.trim()
    if (!query) return setProducts([])

    setLoading(true)
    try {
      const response = await fetch(`/api/products/search?q=${query}`)
      setProducts(await response.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useDebounced(inputRef, 'input', searchProducts)

  return (
    <div>
      <input ref={inputRef} placeholder='Search products...' className='search-input' />
      {loading && <div>Searching...</div>}
      <ProductList products={products} />
    </div>
  )
}
```

#### Vue 3

```vue
<template>
  <input @debounced:input="handleSearch" />
  <button @debounced:click="saveData">Save</button>
</template>

<script setup>
import debounced from 'debounced'
import {onMounted} from 'vue'

onMounted(() => {
  debounced.initialize(['input', 'click'])
})

const handleSearch = event => {
  console.log('Searching:', event.target.value)
}

const saveData = () => {
  console.log('Saving...')
}
</script>
```

#### Alpine.js

```html
<!-- Direct event handling -->
<div x-data="{ search: '' }">
  <input @debounced:input="search = $event.target.value" />
  <div x-show="search.length > 0">Searching for: <span x-text="search"></span></div>
</div>

<!-- Method calls -->
<div x-data="searchComponent()">
  <input @debounced:input="performSearch($event)" />
</div>
```

### HTML-over-the-wire Tools

#### HTMX

```html
<!-- Using hx-trigger with custom events -->
<input type="text" hx-get="/search" hx-trigger="debounced:input" hx-target="#search-results" />

<!-- Using hx-on for event handling -->
<button hx-on:debounced:click="htmx.ajax('POST', '/api/action')">Save Changes</button>
```

#### Hotwire (Turbo + Stimulus)

```erb
<!-- Stimulus controller actions -->
<input data-action="debounced:input->search#query">
<div data-action="debounced:scroll->infinite#loadMore">

<!-- Turbo Frame with debounced submission -->
<form data-turbo-frame="results" data-controller="search">
  <input data-action="debounced:input->search#submit">
</form>
```

#### Unpoly

```html
<!-- Auto-submit forms with debounced events -->
<form up-submit up-target="#results">
  <input up-autosubmit up-watch-event="debounced:input" />
</form>

<!-- JavaScript event handling -->
<script>
  up.on('debounced:input', 'input[type=search]', function (event, element) {
    up.reload('#results', {params: {q: element.value}})
  })
</script>
```

### Web Components

#### Lit

```javascript
import {LitElement, html} from 'lit'

class SearchElement extends LitElement {
  render() {
    return html`
      <input @debounced:input=${this.handleSearch} />
      <button @debounced:click=${this.handleClick}>Search</button>
    `
  }

  handleSearch(e) {
    console.log('Searching:', e.target.value)
  }

  handleClick() {
    console.log('Button clicked')
  }
}
```

### Server-Side Integration

#### Laravel Livewire

```html
<!-- Livewire with Alpine.js integration -->
<div wire:ignore x-data>
  <input type="text" @debounced:input="$wire.set('search', $event.target.value)" />
</div>

<!-- Using JavaScript listener -->
<input type="text" id="search-input" wire:model.defer="search" />
<script>
  document.getElementById('search-input').addEventListener('debounced:input', (e) => {
    @this.set('search', e.target.value)
  })
</script>
```

#### Phoenix LiveView

```elixir
# Using JavaScript interop with custom event listener
<input type="text" id="search-input" phx-hook="DebouncedInput" />

<script>
// In your app.js
Hooks.DebouncedInput = {
  mounted() {
    this.el.addEventListener('debounced:input', (e) => {
      this.pushEvent("search", {query: e.target.value})
    })
  }
}
</script>
```

```elixir
# Or using phx-change to trigger hook when needed
<input type="text"
       phx-hook="DebouncedInput"
       phx-change="validate" />

# Handle search events from the hook
def handle_event("search", %{"query" => query}, socket) do
  {:noreply, assign(socket, search_results: search(query))}
end
```

#### Petite-Vue

```html
<!-- Simple event binding -->
<div v-scope="{ query: '' }">
  <input @debounced:input="query = $event.target.value" />
  <p v-if="query">Results for: {{ query }}</p>
</div>
```

## API Reference

### Methods

| Method                           | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| `initialize(events?, options?)`  | Initialize debounced events (alias for `register`) |
| `register(events, options?)`     | Register events for debouncing                     |
| `registerEvent(event, options?)` | Register a single event                            |
| `unregister(events)`             | Remove event registrations                         |
| `unregisterEvent(event)`         | Remove single event registration                   |

#### Method Details

**`register(events, options?)`** - The core registration method with important behaviors:

- Can be called multiple times to add new events or modify existing ones
- Re-registering an event completely replaces its configuration
- Unspecified options revert to defaults: `{wait: 200, leading: false, trailing: true}`
- Does not affect other registered events

Example of re-registration:

```javascript
// Initial setup
debounced.register(['input'], {wait: 300, trailing: true})

// Later: make it faster with leading
debounced.register(['input'], {wait: 100, leading: true})
// Note: trailing reverts to true (default) since not specified
```

### Properties

| Property               | Type   | Description                                     |
| ---------------------- | ------ | ----------------------------------------------- |
| `defaultEventNames`    | Array  | All 86 delegatable events                       |
| `defaultOptions`       | Object | `{ wait: 200, leading: false, trailing: true }` |
| `registeredEvents`     | Object | Currently registered events with options        |
| `registeredEventNames` | Array  | List of registered event names                  |
| `prefix`               | String | Event name prefix (default: 'debounced')        |
| `version`              | String | Library version                                 |

### Options

```javascript
{
  wait: 200,        // Milliseconds to wait
  leading: false,   // Fire on leading edge
  trailing: true    // Fire on trailing edge (default)
}
```

### Event Structure

All debounced events are CustomEvents with this structure:

```javascript
{
  target: Element,           // The element that triggered the event
  type: 'debounced:input',   // The debounced event name
  detail: {
    sourceEvent: Event,      // The original native event
    type: 'leading' | 'trailing'  // When the debounce fired
  },
  bubbles: true,            // Always true (inherited from source)
  cancelable: Boolean,      // Inherited from source event
  composed: Boolean         // Inherited from source event
}
```

## Browser Support

| Browser | Minimum Version |
| ------- | --------------- |
| Chrome  | 51+             |
| Firefox | 54+             |
| Safari  | 10+             |
| Edge    | 79+             |

**Required Features:**

- ES2020 syntax support
- `CustomEvent` constructor
- `addEventListener` / `removeEventListener`

## Troubleshooting

### Events Not Firing

```javascript
// ❌ Wrong: listening to original event
element.addEventListener('input', handler)

// ✅ Correct: listening to debounced event
element.addEventListener('debounced:input', handler)

// ✅ Also check: initialization was called
debounced.initialize()
```

### Custom Events Not Working

```javascript
// ❌ Wrong: custom event doesn't bubble
element.dispatchEvent(new CustomEvent('myEvent'))

// ✅ Correct: custom event must bubble
element.dispatchEvent(new CustomEvent('myEvent', {bubbles: true}))
```

### Timing Issues

```javascript
// Too slow? Reduce wait time
debounced.register(['input'], {wait: 100})

// Need immediate response? Use leading
debounced.register(['click'], {leading: true})
```

## FAQ

### What events are supported by default?

**110 total events** including:

- **86 document-delegated events** that work with event delegation (`click`, `input`, `keydown`, `mousemove`, etc.)
- **32 window events** including window-only events (`storage`, `online`, `offline`, etc.)
- **8 events with dual registration** that work on both window and document (`resize`, `scroll`, `load`, etc.)

[View the complete list](src/events.js).

### Can I register an event multiple times?

Yes, re-registering completely replaces the previous configuration. This is useful for dynamically adjusting debounce behavior:

```javascript
// Start with quick response for typing
debounced.register(['input'], {wait: 100})

// User enables "slow mode"
debounced.register(['input'], {wait: 500})

// Switch to instant feedback
debounced.register(['input'], {wait: 50, leading: true})
```

**Note:** Any options not specified in re-registration will revert to defaults.

### What happens to pending timeouts when unregistering?

Pending timeouts continue to fire even after unregistration. The timeout was already scheduled and will complete.

### Do I need to use event.detail.sourceEvent for everything?

No! Since debounced events are dispatched on the same target element:

- Use `event.target` directly for element properties (`.value`, `.checked`, etc.)
- Use `event.detail.sourceEvent` only for original event-specific properties (`.key`, `.keyCode`, etc.)

### How is this different from a debounce utility?

Instead of wrapping every handler with `debounce(handler, wait)`, you initialize once and use standard event listeners. This provides consistency across your entire application.

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for development setup and guidelines.

### Quick Development Setup

```bash
npm install
npx playwright install
npm test
```

### Testing

The test suite includes 147 automated tests covering all functionality across Chromium, Firefox, and WebKit, including:

- Event registration modification after initialization
- Re-registration with different options
- Edge cases and error handling

### Releasing

1. Update version in `package.json` and `src/version.js`
2. Run `npm run build`
3. Create GitHub release
4. GitHub Actions automatically publishes to npm
