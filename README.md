[![CI](https://github.com/hopsoft/debounced/actions/workflows/test.yml/badge.svg)](https://github.com/hopsoft/debounced/actions/workflows/test.yml)
[![Lines of Code](https://img.shields.io/badge/loc-235-47d299.svg)](http://blog.codinghorror.com/the-best-code-is-no-code-at-all/)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/865251d9cf564a01b263762f4a2bf71a)](https://app.codacy.com/gh/hopsoft/debounced/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![NPM Version](https://img.shields.io/npm/v/debounced?color=168AFE&logo=npm)](https://www.npmjs.com/package/debounced)
[![NPM Downloads](https://img.shields.io/npm/d18m/debounced.svg?color=168AFE&logo=npm)](https://www.npmjs.com/package/debounced)
[![NPM Bundle Size](https://img.shields.io/bundlephobia/minzip/debounced?label=bundle%20size&logo=npm&color=47d299)](https://bundlephobia.com/package/debounced)

# Debounced

Stop overwhelming your app with excessive events. Transform high-frequency events like `input`, `scroll`, and `resize` into manageable, debounced versions that fire only when users finish their actions.

**One line of initialization. Every framework supported. Zero dependencies.**

```javascript
// Initialize once in your app
import debounced from 'debounced'
debounced.initialize()
```

**That's it.** Now vanilla JavaScript and every client-side framework can use debounced events.

```javascript
// Vanilla JavaScript - works immediately, no framework needed
const el = document.getElementById('example')
el.addEventListener('debounced:input', evt => `Do something with ${evt.target.value}`)
```

```html
<!-- Works with every framework -->

<!-- Alpine.js -->
<input @debounced:input="search = $event.target.value" x-model="search" />

<!-- Vue -->
<input @debounced:input="handleSearch" v-model="searchQuery" />

<!-- React (with ref) -->
<input ref="{el" ="" /> el?.addEventListener('debounced:input', handleSearch)} />

<!-- HTMX -->
<input hx-trigger="debounced:input" hx-get="/search" hx-target="#results" />
```

## Why You Need This

High-frequency events can fire hundreds of times per second, overwhelming your app with expensive operations like API calls or DOM updates. Every framework handles debouncing differently - or not at all.

**Without Debounced:** Inconsistent syntax, framework-specific solutions, performance bottlenecks
**With Debounced:** Universal syntax, single implementation, optimized performance

```html
<!-- Framework-specific debounce syntax is inconsistent -->
<input @input.debounce.500ms="search" /><!-- Alpine.js -->
<input hx-trigger="input delay:300ms" hx-get="/search" /><!-- HTMX -->
<input wire:model.live.debounce.500ms="search" /><!-- Livewire -->
<!-- Stimulus: Requires stimulus-use or custom solution for debounce -->
```

### Universal Solution

Debounced provides consistent `debounced:` events that work identically across all frameworks:

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

## Key Benefits

- **Universal Compatibility** - Works with any JavaScript framework or vanilla JS
- **True DOM Events** - Standard CustomEvents, no wrappers or adapters needed
- **113+ Events Supported** - All native DOM events, window events, and custom events
- **Zero Dependencies** - Pure JavaScript, lightweight at 6KB minified
- **Event Delegation** - Automatically works with dynamic elements
- **Per-Element Timers** - Each element maintains independent debounce state
- **Nested Scrollables** - Full support for individually scrollable elements
- **Leading & Trailing** - Fire at start, end, or both (most frameworks only support trailing)

## Table of Contents

<!-- toc -->

- [Quick Start](#quick-start)
- [Requirements](#requirements)
- [Installation](#installation)
- [How It Works](#how-it-works)
- [Basic Usage](#basic-usage)
- [Window Events](#window-events)
- [Nested Scrollable Elements](#nested-scrollable-elements)
- [Timing Configuration](#timing-configuration)
- [Event Management](#event-management)
- [Leading vs Trailing Events](#leading-vs-trailing-events)
- [Custom Events](#custom-events)
- [Performance Optimization](#performance-optimization)
- [Framework Integration](#framework-integration)
- [API Reference](#api-reference)
- [Browser Support](#browser-support)
- [Troubleshooting](#troubleshooting)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Contributing](#contributing)

<!-- tocstop -->

## Quick Start

### 1. Install

```bash
npm install debounced
```

### 2. Initialize Once

```javascript
import debounced from 'debounced'
debounced.initialize()
```

### 3. Use Everywhere

Add the `debounced:` prefix to any event name in your existing code:

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

### Common Use Cases

**Search with Live Results**

```html
<input hx-get="/search" hx-trigger="debounced:input" hx-target="#results" placeholder="Search products..." />
```

**Auto-Save Forms**

```html
<textarea @debounced:input="autoSave($event.target.value)" placeholder="Your content auto-saves as you type"></textarea>
```

**Prevent Double-Clicks**

```html
<button @debounced:click="submitOrder" :disabled="submitting">Place Order</button>
```

**Smooth Infinite Scroll**

```html
<div data-action="debounced:scroll->infinite#loadMore">
  <!-- Content loads automatically as user scrolls -->
</div>
```

**Keyboard Shortcuts**

```javascript
document.addEventListener('debounced:keydown', event => {
  const {key, ctrlKey, metaKey} = event.detail.sourceEvent
  if (key === 's' && (ctrlKey || metaKey)) {
    event.preventDefault()
    saveDocument()
  }
})
```

## Requirements

**Browser Support**: Modern browsers with `CustomEvent` support

- Chrome 51+, Firefox 54+, Safari 10+, Edge 79+

**Module System**: ES modules or a bundler like webpack/vite

**Prerequisites**: Basic understanding of event listeners and ES6 syntax

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

### The Performance Problem

High-frequency events fire excessively, overwhelming your app:

- **Search input**: 100+ events per second while typing
- **Scroll events**: 300+ events per second during scrolling
- **Mouse movement**: 1000+ events per second during tracking

Attaching expensive operations (API calls, DOM updates) to these events creates performance bottlenecks.

### The Debounced Solution

Debounced transforms these excessive events into single, well-timed events that fire only after users complete their actions:

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

### Implementation Benefits

- **Memory Efficient**: Single listener per event type via event delegation
- **Per-Element Timers**: Each element maintains independent debounce state
- **Dynamic Elements**: Works automatically with elements added after page load
- **Zero Dependencies**: Pure JavaScript, no external libraries

## Basic Usage

### Step 1: Initialize Events

```javascript
import debounced from 'debounced'

// Easiest: Initialize all 92 delegatable events
debounced.initialize()

// Most efficient: Initialize only what you need
debounced.initialize(['input', 'click', 'resize'])

// Custom timing: Adjust wait period for specific events
debounced.initialize(['input'], {wait: 300})
```

### Step 2: Listen for Debounced Events

Transform any event by adding the `debounced:` prefix:

```javascript
// Original event → Debounced event
// 'input'        → 'debounced:input'
// 'click'        → 'debounced:click'
// 'scroll'       → 'debounced:scroll'

element.addEventListener('debounced:input', handler)
element.addEventListener('debounced:click', handler)
window.addEventListener('debounced:scroll', handler)
```

### Step 3: Access Event Data

Debounced events contain all the information you need from the original event:

```javascript
document.addEventListener('debounced:input', event => {
  // Use event.target for element properties (most common)
  console.log(event.target.value) // Input value
  console.log(event.target.checked) // Checkbox state
  console.log(event.target.id) // Element ID

  // Use event.detail.sourceEvent for original event properties
  const original = event.detail.sourceEvent
  console.log(original.key) // 'Enter', 'a', etc.
  console.log(original.shiftKey) // Was shift pressed?
  console.log(original.timeStamp) // When original event fired

  // Check when debounce fired
  console.log(event.detail.type) // 'leading' or 'trailing'
})
```

**Quick Reference**

| For...             | Use                          | Example                         |
| ------------------ | ---------------------------- | ------------------------------- |
| Element properties | `event.target.*`             | `.value`, `.checked`, `.id`     |
| Keyboard details   | `event.detail.sourceEvent.*` | `.key`, `.shiftKey`, `.ctrlKey` |
| Mouse details      | `event.detail.sourceEvent.*` | `.clientX`, `.clientY`          |
| Timing info        | `event.detail.type`          | `'leading'` or `'trailing'`     |

## Window Events

Beyond regular DOM events, Debounced supports 21 window-specific events that are essential for app performance and lifecycle management.

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

## Nested Scrollable Elements

Debounced fully supports scroll events on individually scrollable elements like sidebars, chat windows, and nested containers. Each element maintains its own independent debounce state, making it perfect for:

- **Multi-pane layouts** - Independent scroll tracking for each pane
- **Infinite scroll lists** - Debounce scroll events in specific containers
- **Chat interfaces** - Track scroll position in message containers
- **Code editors** - Monitor scroll in editor panes separately

Simply add `debounced:scroll` listeners directly to any scrollable element - they work independently from each other and from the main page scroll.

## Timing Configuration

### Choose Your Wait Time

The wait time determines how long to pause after the last event before firing the debounced version:

```javascript
// Default: 200ms (good for most use cases)
debounced.initialize()

// Longer waits for user input
debounced.register(['input'], {wait: 300}) // Search: let users finish typing

// Shorter waits for responsive interactions
debounced.register(['scroll'], {wait: 50}) // Scrolling: stay responsive
debounced.register(['mousemove'], {wait: 16}) // Animation: 60fps smoothness
```

### Recommended Timing by Use Case

| Use Case              | Wait Time  | Why This Works                          |
| --------------------- | ---------- | --------------------------------------- |
| **Search input**      | 300-500ms  | Matches natural typing pauses           |
| **Form validation**   | 1000ms     | Validates after users finish a field    |
| **Scroll effects**    | 50-100ms   | Smooth without overwhelming the browser |
| **Window resize**     | 150-300ms  | Handles drag-resize completion          |
| **Button protection** | 500-1000ms | Prevents accidental double-clicks       |
| **Mouse tracking**    | 16ms       | Maintains 60fps for animations          |

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

## Leading vs Trailing Events

### When Should Events Fire?

Choose when your debounced events trigger based on user experience needs:

- **Trailing** (default): Fire after users finish their action
- **Leading**: Fire immediately when users start their action
- **Both**: Fire at start AND end for immediate + final feedback

```javascript
// Trailing only: Wait for user to finish (default)
debounced.register(['input'], {
  wait: 300,
  trailing: true, // Default behavior
})

// Leading only: Respond immediately, block repeats
debounced.register(['click'], {
  wait: 1000,
  leading: true,
  trailing: false,
})

// Both: Immediate response + final confirmation
debounced.register(['scroll'], {
  wait: 100,
  leading: true,
  trailing: true,
})
```

### Choose the Right Mode

| Mode              | Best For                        | Example Use Cases                   |
| ----------------- | ------------------------------- | ----------------------------------- |
| **Trailing only** | Wait for completion             | Search suggestions, form validation |
| **Leading only**  | Immediate response + protection | Button clicks, analytics tracking   |
| **Both modes**    | Instant feedback + final state  | Scroll position, drag operations    |

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

### Best Practices for Maximum Efficiency

**Initialize Only What You Need**

```javascript
// ✅ Efficient: Register specific events
debounced.initialize(['input', 'click', 'resize'])

// ❌ Wasteful: Register all 92 events if you only use a few
debounced.initialize() // Only do this if you need most events
```

**Tune Timing for Each Use Case**

```javascript
// Fast response for user interactions
debounced.register(['input'], {wait: 300}) // Typing
debounced.register(['mousemove'], {wait: 16}) // 60fps tracking
debounced.register(['resize'], {wait: 200}) // Window sizing
```

### Real Performance Impact

Here's what debouncing achieves in a typical search input scenario:

**Without Debouncing** (300 keystrokes)

- API calls: 300 requests
- Network usage: 450KB transferred
- Response time: 2.3s average
- CPU usage: High (constant processing)

**With Debouncing** (300ms wait)

- API calls: 1 request
- Network usage: 1.5KB transferred
- Response time: 0.2s
- CPU usage: Minimal

**Built-in Efficiency Features**

- Single document listener per event type (memory efficient)
- Automatic timer cleanup (no memory leaks)
- Works with dynamic content (no manual management)
- Performance scales regardless of element count

## Framework Integration

Debounced works with every JavaScript framework because it uses standard DOM events. If your framework can handle `click` events, it can handle `debounced:click` events - no special integration required.

### Event Coverage

**113+ events supported (including custom events):**

- 92 document events (click, input, keydown, mousemove, etc.)
- 21 window-only events (storage, online, offline, devicemotion, etc.)
- All events work consistently across frameworks

### Framework Comparison

| Framework     | Built-in Debounce                                   | What Debounced Adds                                                              |
| ------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Alpine.js** | `@input.debounce.500ms`<br/>Input/model events only | ✅ All 113+ events<br/>✅ Leading + trailing timing<br/>✅ Custom events         |
| **HTMX**      | `hx-trigger="delay:300ms"`<br/>Server requests only | ✅ Works with local JS<br/>✅ Beyond HTMX requests<br/>✅ True debounce behavior |
| **Livewire**  | `wire:model.debounce.500ms`<br/>Model binding only  | ✅ All event types<br/>✅ Client-side only<br/>✅ Leading + trailing             |
| **LiveView**  | `phx-debounce="300"`<br/>Server events only         | ✅ Client-side handling<br/>✅ Non-phx events<br/>✅ Stable timers               |
| **React**     | No built-in support                                 | ✅ Declarative events<br/>✅ No wrapper functions<br/>✅ Works with refs         |
| **Vue**       | No built-in support                                 | ✅ Template-friendly<br/>✅ Consistent syntax<br/>✅ All event types             |
| **Stimulus**  | Requires stimulus-use                               | ✅ Zero dependencies<br/>✅ 113+ events<br/>✅ Per-element timers                |

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

| Property                       | Type   | Description                                        |
| ------------------------------ | ------ | -------------------------------------------------- |
| `defaultBubblingEventNames`    | Array  | All 80 naturally bubbling events                   |
| `defaultCapturableEventNames`  | Array  | All 12 capturable non-bubbling events              |
| `defaultDelegatableEventNames` | Array  | All 92 delegatable events (bubbling + capturable)  |
| `defaultWindowEventNames`      | Array  | All 105 window events (including shared events)    |
| `defaultEventNames`            | Array  | All 113 unique native events across all categories |
| `defaultOptions`               | Object | `{ wait: 200, leading: false, trailing: true }`    |
| `registeredEvents`             | Object | Currently registered events with options           |
| `registeredEventNames`         | Array  | List of registered event names                     |
| `prefix`                       | String | Event name prefix (default: 'debounced')           |
| `version`                      | String | Library version                                    |

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

### Common Issues and Solutions

**Problem: Events aren't firing**

```javascript
// ❌ Listening to original event instead of debounced
element.addEventListener('input', handler)

// ✅ Listen to the debounced version
element.addEventListener('debounced:input', handler)

// ✅ Make sure you initialized first
debounced.initialize()
```

**Problem: Custom events don't work**

```javascript
// ❌ Custom event doesn't bubble (won't reach document listener)
element.dispatchEvent(new CustomEvent('myEvent'))

// ✅ Custom events must bubble for event delegation
element.dispatchEvent(new CustomEvent('myEvent', {bubbles: true}))
```

**Problem: Events fire too slowly or quickly**

```javascript
// Too slow? Reduce wait time
debounced.register(['input'], {wait: 100})

// Need immediate response? Use leading mode
debounced.register(['click'], {leading: true, trailing: false})

// Want both immediate + final? Use both modes
debounced.register(['scroll'], {leading: true, trailing: true})
```

## Frequently Asked Questions

### Which events are supported?

All major DOM events work with Debounced:

- **Standard events**: click, input, keydown, scroll, resize, focus, blur, etc.
- **Mouse events**: mousemove, mouseenter, mouseleave, drag events
- **Touch events**: touchstart, touchmove, touchend
- **Window events**: storage, online, offline, devicemotion
- **113+ total events** - Native DOM events plus any custom events - [see complete list](src/events.js)

### Can I change settings after initialization?

Yes! Re-registering an event updates its configuration:

```javascript
// Start conservative
debounced.register(['input'], {wait: 500})

// Make it more responsive later
debounced.register(['input'], {wait: 100, leading: true})
```

**Note**: Unspecified options reset to defaults when re-registering.

### When should I use event.target vs event.detail.sourceEvent?

**Use `event.target` for element properties** (most common):

- `event.target.value` - input values
- `event.target.checked` - checkbox state
- `event.target.id` - element ID

**Use `event.detail.sourceEvent` for event-specific data**:

- `event.detail.sourceEvent.key` - keyboard key
- `event.detail.sourceEvent.clientX` - mouse position

### How is this different from other debounce solutions?

Traditional debounce utilities require wrapping each handler:

```javascript
// Traditional approach - inconsistent across codebase
element.addEventListener('input', debounce(handler, 300))
button.addEventListener('click', debounce(clickHandler, 500))
```

Debounced provides universal consistency:

```javascript
// Debounced approach - consistent everywhere
element.addEventListener('debounced:input', handler)
button.addEventListener('debounced:click', clickHandler)
```

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for development setup and guidelines.

### Quick Development Setup

```bash
npm install
npx playwright install
npm test              # Run 200+ comprehensive tests
npm run test:visual   # Interactive visual test page
```

The project includes a comprehensive test suite with 200+ tests covering all event types, edge cases, and browser compatibility. The visual test page provides real-time monitoring of event debouncing behavior.

### Testing

The test suite includes 204 automated tests covering all functionality across Chromium, Firefox, and WebKit, including:

- Event registration modification after initialization
- Re-registration with different options
- Edge cases and error handling
- Visual test page with real-time event monitoring

#### Visual Testing

Run the interactive visual test suite to see debouncing in action:

```bash
npm run test:visual  # Opens browser with visual test page
```

The visual test page features:

- Real-time event counters showing native vs debounced events
- Efficiency metrics (% reduction in events)
- Visual grid displaying all 105+ DOM events with color-coded status
- Interactive elements to test different event types
- Automated test runner with progress tracking

### Releasing

1. Update version in `package.json` and `src/version.js`
2. Run `npm run build`
3. Create GitHub release
4. GitHub Actions automatically publishes to npm
