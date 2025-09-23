[![CI](https://github.com/hopsoft/debounced/actions/workflows/test.yml/badge.svg)](https://github.com/hopsoft/debounced/actions/workflows/test.yml)
[![Lines of Code](https://img.shields.io/badge/loc-259-47d299.svg)](http://blog.codinghorror.com/the-best-code-is-no-code-at-all/)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/865251d9cf564a01b263762f4a2bf71a)](https://app.codacy.com/gh/hopsoft/debounced/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![NPM Version](https://img.shields.io/npm/v/debounced?color=168AFE&logo=npm)](https://www.npmjs.com/package/debounced)
[![NPM Downloads](https://img.shields.io/npm/d18m/debounced.svg?color=168AFE&logo=npm)](https://www.npmjs.com/package/debounced)
[![NPM Bundle Size](https://img.shields.io/bundlephobia/minzip/debounced?label=bundle%20size&logo=npm&color=47d299)](https://bundlephobia.com/package/debounced)

# Debounced

**Transform any DOM event into a debounced version. Works with every framework.**

```javascript
import debounced from 'debounced'
debounced.initialize() // One line. Zero dependencies.

// Now any event becomes debounceable:
// input → debounced:input
// scroll → debounced:scroll
// resize → debounced:resize
// ...any of 113+ events
```

## Why Use This?

**This library gives you:**

- ✅ **All 113+ DOM events** - Not just input. Debounce scroll, resize, mousemove, _anything..._
- ✅ **Dynamic elements** - Event delegation means new elements automatically work
- ✅ **Leading & trailing** - Fire at start, end, or both (most frameworks: trailing only)
- ✅ **True DOM events** - They bubble, compose, and work with the platform
- ✅ **One syntax everywhere** - Same pattern in every framework and vanilla JS
- ✅ **Per-element timers** - Each element maintains independent debounce state

**"My framework already has debounce. Why do I need this?"**

Because framework debouncing is limited and inconsistent:

| Framework | Built-in Debounce     | Limitation                       |
| --------- | --------------------- | -------------------------------- |
| Alpine.js | `@event.debounce`     | Trailing only, no event bubbling |
| HTMX      | `hx-trigger delay`    | Only for server requests         |
| LiveView  | `phx-debounce`        | Only for server events           |
| Livewire  | `wire:model.debounce` | Only for model binding           |
| React     | None                  | Write your own wrappers          |
| Stimulus  | stimulus-use addon    | useDebounce broken since v0.51.2 |
| Vue       | None                  | Write your own wrappers          |

## Works With

Debounced works with vanilla JavaScript and every lib/framework because it uses standard DOM events. If your framework can handle `click` events, it can handle `debounced:click` events - no special integration required.

**HTML-first frameworks:** Alpine.js, HTMX, LiveView, Livewire, Stimulus, ...
**Component frameworks:** Angular, React, SolidJS, Svelte, Vue, ...
**Vanilla JavaScript:** Any browser, any environment...
**Template engines:** Blade, Django, ERB, EJS, Handlebars, Jinja2, ...

## Key Advantage: True Event Bubbling

Every native event automatically creates a corresponding `debounced:*` event that bubbles through the DOM:

```html
<!-- ANY click on ANY button creates a debounced:click event -->
<div id="container">
  <button>Save</button>
  <button>Cancel</button>
  <button>Submit</button>
</div>
```

```javascript
// Parent containers catch child events via bubbling
document.getElementById('container').addEventListener('debounced:click', e => {
  // Handles clicks from ALL child buttons
})

// Listen ANYWHERE in your app
document.addEventListener('debounced:click', e => {
  console.log('Debounced click from:', e.target)
})

// Global analytics see everything
window.addEventListener('debounced:input', trackUserActivity)
```

### Common framework limitations:

Most framework debouncing only delays **function calls** or **server requests** - they don't create actual DOM events. This means:

- ❌ Other components can't listen for the debounced events
- ❌ Parent elements can't catch child events via bubbling
- ❌ Analytics/logging can't observe debounced interactions
- ❌ You need per-element configuration (no event delegation)

### What Debounced provides:

- ✅ **Any element** clicking creates `debounced:click` that bubbles up
- ✅ **Any component** can listen for debounced events from other components
- ✅ **Parent containers** automatically handle all child debounced events
- ✅ **Third-party code** can observe your app's debounced interactions

## Common Use Cases

- **Search as you type** - Without overwhelming your server
- **Auto-save forms** - Save drafts without constant writes
- **Infinite scroll** - Load more content without scroll spam
- **Resize handlers** - Respond to window resize efficiently
- **Double-click prevention** - Avoid duplicate submissions
- **Analytics tracking** - Batch events instead of flooding
- **Reactive UIs** - Update expensive computations smoothly

## Table of Contents

<!-- toc -->

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Window Events](#window-events)
- [Nested Scrollable Elements](#nested-scrollable-elements)
- [Timing Configuration](#timing-configuration)
- [Event Management](#event-management)
- [Leading vs Trailing Events](#leading-vs-trailing-events)
- [Custom Events](#custom-events)
- [Performance Optimization](#performance-optimization)
- [API Reference](#api-reference)
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

Just prefix any event with `debounced:`:

```javascript
// Vanilla JavaScript
element.addEventListener('debounced:input', handler)
document.addEventListener('debounced:scroll', handler)
window.addEventListener('debounced:resize', handler)

// Works in HTML attributes with any framework:
// @debounced:input, hx-trigger="debounced:input", data-action="debounced:input->controller#method"
```

## Installation

```bash
npm install debounced
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

## Basic Usage

### Step 1: Initialize Events

```javascript
import debounced from 'debounced'

// Easiest: Initialize all 113+ default events
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

## Event Management

### Add Events After Initialization

```javascript
// Add new events anytime
debounced.register(['focus', 'blur'], {wait: 100})

// Register individual event
debounced.registerEvent('keydown', {wait: 250})

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

> [!IMPORTANT]
> Re-registration replaces the entire configuration. Any unspecified options return to defaults.

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

- **Leading**: Fires ONCE at the start of an event sequence
- **Trailing** (default): Fires ONCE after a pause in events
- **Both**: Fires at start AND end of an event sequence (max 2 events per burst)

### How they differ from native events:

```javascript
// NATIVE: Every click fires immediately
button.addEventListener('click', save)
// Click 5 times rapidly = save() called 5 times

// LEADING: First click fires immediately (only once)
debounced.register(['click'], {leading: true, trailing: false, wait: 1000})
// Click 5 times rapidly = save() called ONCE immediately

// TRAILING: Fires once after clicking stops
debounced.register(['click'], {leading: false, trailing: true, wait: 300})
// Click 5 times rapidly = save() called ONCE after 300ms pause

// BOTH: Immediate feedback + final state
debounced.register(['click'], {leading: true, trailing: true, wait: 300})
// Click 5 times rapidly = save() called TWICE (start + end)
```

### Configuration examples:

```javascript
// Search input: Wait for user to finish typing
debounced.register(['input'], {
  wait: 300,
  trailing: true, // Fires once typing pauses
})

// Save button: Immediate response, prevent double-saves
debounced.register(['click'], {
  wait: 1000,
  leading: true, // Fires on first click
  trailing: false, // Ignores subsequent clicks
})

// Scroll tracking: Know when scrolling starts and ends
debounced.register(['scroll'], {
  wait: 100,
  leading: true, // Fires at scroll start
  trailing: true, // Fires at scroll end
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
debounced.registerEvent('my-custom-event', {wait: 200})

// Dispatch your custom event (must bubble!)
const customEvent = new CustomEvent('my-custom-event', {
  bubbles: true, // Required for event delegation
  detail: {someData: 'value'},
})
element.dispatchEvent(customEvent)

// Listen for debounced version
document.addEventListener('debounced:my-custom-event', handler)
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
// Efficient: Register specific events
debounced.initialize(['input', 'click', 'resize'])

// Wasteful: Register all 113+ events if you only use a few
debounced.initialize() // Only do this if you need most events
```

**Tune Timing for Each Use Case**

```javascript
// Fast response for user interactions
debounced.register(['input'], {wait: 300}) // Typing
debounced.register(['mousemove'], {wait: 50}) // Smooth effects
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

### Event Coverage

**113+ events supported (including custom events):**

- 92 document events (click, input, keydown, mousemove, etc.)
- 21 window-only events (storage, online, offline, devicemotion, etc.)
- All events work consistently across frameworks

### What Debounced Provides vs Framework Solutions

Instead of framework-specific debouncing that only delays functions or server requests, Debounced provides:

- ✅ **Real DOM events** that bubble and can be observed anywhere
- ✅ **Leading + trailing modes** (not just trailing)
- ✅ **Event delegation** for dynamic elements
- ✅ **113+ events** (not limited to specific interactions)
- ✅ **Cross-component communication** without props or state
- ✅ **Consistent API** across all frameworks and vanilla JS

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
// trailing reverts to true (default) since not specified
```

### Properties

| Property                       | Type   | Description                                        |
| ------------------------------ | ------ | -------------------------------------------------- |
| `defaultBubblingEventNames`    | Array  | All 80 naturally bubbling events                   |
| `defaultCapturableEventNames`  | Array  | All 13 capturable non-bubbling events              |
| `defaultDelegatableEventNames` | Array  | All 92 delegatable events (bubbling + capturable)  |
| `defaultWindowEventNames`      | Array  | All 113 window events (including shared events)    |
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
  target: Element,               // The element that triggered the event
  type: 'debounced:input',       // The debounced event name
  detail: {
    sourceEvent: Event,          // The original native event
    type: 'leading' | 'trailing' // When the debounce fired
  },
  bubbles: Boolean,              // Inherited from source event
  cancelable: Boolean,           // Inherited from source event
  composed: Boolean              // Inherited from source event
}
```

## Troubleshooting

### Common Issues and Solutions

**Problem: Events aren't firing**

```javascript
// ✗ Listening to original event instead of debounced
element.addEventListener('input', handler)

// ✓ Listen to the debounced version
element.addEventListener('debounced:input', handler)

// ✓ Make sure you initialized first
debounced.initialize()
```

**Problem: Custom events don't work**

```javascript
// ✗ Custom event doesn't bubble (won't reach document listener)
element.dispatchEvent(new CustomEvent('myEvent'))

// ✓ Custom events must bubble for event delegation
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

> [!NOTE]
> Unspecified options reset to defaults when re-registering.

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
2. Run `npm run build` and commit changes
3. Create annotated tag: `git tag -a vX.X.X -m "Release vX.X.X"`
4. Push commits and tag: `git push REMOTE_NAME main --follow-tags`
5. Create GitHub release from the tag
6. GitHub Actions automatically publishes to npm
